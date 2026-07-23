"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { DetailPesanan, CartItem, JenisLayanan, StatusPesanan, StatusTiket, PesananEdit, StrukKasirData } from "@/lib/types";
import { cekStokCukup } from "@/lib/utils/cek-stok";
import type { PoolConnection } from "mysql2/promise";

interface NextUrutRow extends RowDataPacket {
  next_urut: number;
}

interface NextAntrianRow extends RowDataPacket {
  next_nomor: number;
}

/**
 * Buat nomor antrian berikutnya untuk take away, format "A-01".
 * Nomor direset tiap hari — tanggal berganti, mulai lagi dari A-01.
 * WAJIB dipanggil di dalam transaksi.
 */
async function buatNomorAntrian(connection: PoolConnection): Promise<string> {
  // Kunci baris take away hari ini supaya dua kasir yang input bersamaan
  // tidak mendapat nomor yang sama
  await connection.query(
    `SELECT id_pesanan FROM Pesanan
     WHERE jenis_layanan = 'take_away' AND DATE(waktu_pesan) = CURDATE()
     FOR UPDATE`
  );

  const [rows] = await connection.query<NextAntrianRow[]>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(nomor_antrian, 3) AS UNSIGNED)), 0) + 1 AS next_nomor
     FROM Pesanan
     WHERE jenis_layanan = 'take_away'
       AND nomor_antrian IS NOT NULL
       AND DATE(waktu_pesan) = CURDATE()`
  );

  return `A-${String(rows[0].next_nomor).padStart(2, "0")}`;
}

interface PesananListRow extends RowDataPacket {
  id_karyawan: number;
  id_meja: number | null;

  id_pesanan: number;
  jenis_layanan: JenisLayanan;
  status_pesanan: StatusPesanan;
  status_tiket: StatusTiket | null;

  waktu_pesan: Date;
  total_tagihan: number;
  nomor_meja: string | null;
  nomor_antrian: string | null;

  id_detail: number | null;
  id_menu: number | null;
  jumlah: number | null;
  harga_satuan: number | null;
  subtotal: number | null;
  nama_menu: string | null;
}


interface TiketRow extends RowDataPacket {
  id_tiket: number;
  status_tiket: string;
}

interface PesananRow extends RowDataPacket {
  id_karyawan: number;
  id_meja: number | null;
  jenis_layanan: JenisLayanan;
  status_pesanan: StatusPesanan;
  status_tiket: StatusTiket | null;
  nomor_antrian: string | null;
}

interface DetailPesananRow extends RowDataPacket {
  id_menu: number;
  jumlah: number;
}

interface JumlahPesananRow extends RowDataPacket {
  jumlah: number;
}

interface PesananEditRow extends RowDataPacket {
  id_pesanan: number;
  id_meja: number | null;
  jenis_layanan: JenisLayanan;
  status_pesanan: StatusPesanan;
  status_tiket: StatusTiket | null;
  metode_pembayaran: string | null;
  jumlah_bayar: number | null;
}

interface DetailEditRow extends RowDataPacket {
  id_menu: number;
  nama_menu: string;
  harga_satuan: number;
  jumlah: number;
  catatan_item: string | null;
  gambar_url: string | null;
}

interface IdPembayaranRow extends RowDataPacket {
  id_pembayaran: number;
}

interface StrukKasirRow extends RowDataPacket {
  id_pesanan: number;
  jenis_layanan: JenisLayanan;
  nomor_meja: string | null;
  nomor_antrian: string | null;
  nama_karyawan: string | null;
  waktu_pesan: Date;
  total_tagihan: number;
  metode_pembayaran: string | null;
}

interface StrukKasirItemRow extends RowDataPacket {
  nama_menu: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  catatan_item: string | null;
}

interface PesananGroup {
  idPesanan: number;
  idKaryawan: number;
  idMeja?: number;

  jenisLayanan: JenisLayanan;
  statusPesanan: StatusPesanan;
  statusTiket?: StatusTiket | null;

  waktuPesan: string;
  totalTagihan: number;
  nomorMeja?: string;
  nomorAntrian?: string;

  detailPesanan: DetailPesanan[];
}

export async function createPesananLengkap(data: {
  idKaryawan: number;
  idMeja: number | null;
  jenisLayanan: JenisLayanan;
  cartItems: CartItem[];
  metodePembayaran: "tunai" | "qris" | "edc";
  subtotal: number;
  pajak: number;
  diskon: number;
  total: number;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 0. Validasi stok — pesanan ditolak kalau bahan baku tidak mencukupi
    const stokError = await cekStokCukup(connection, data.cartItems);
    if (stokError) {
      await connection.rollback();
      return { success: false, message: stokError };
    }

    // 0c. Nomor antrian hanya untuk take away — dine in cukup pakai nomor meja
    const nomorAntrian =
      data.jenisLayanan === "take_away" ? await buatNomorAntrian(connection) : null;

    // 1. Insert Pesanan
    const [pesananResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Pesanan (id_meja, id_karyawan, jenis_layanan, sumber_pesanan, nomor_antrian, status_pesanan, total_tagihan)
      VALUES (?, ?, ?, 'on_shop', ?, 'diproses', ?)`,
      [data.idMeja, data.idKaryawan, data.jenisLayanan, nomorAntrian, data.total]
    );
    const idPesanan = pesananResult.insertId;

    // 2. Insert Detail_Pesanan per item cart
    for (const item of data.cartItems) {
      await connection.query(
        `INSERT INTO Detail_Pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal, catatan_item)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idPesanan, item.idMenu, item.jumlah, item.harga, item.harga * item.jumlah, item.catatanItem ?? null]
      );
    }

    // 3. Insert Pembayaran (langsung berhasil, sesuai alur Pro-2 di kasir)
    await connection.query(
      `INSERT INTO Pembayaran (id_pesanan, metode_pembayaran, jumlah_bayar, status_pembayaran)
       VALUES (?, ?, ?, 'berhasil')`,
      [idPesanan, data.metodePembayaran, data.total]
    );

    // 4. Insert Tiket_Dapur (FIFO - urutan antrian = max + 1)
    const [maxUrutRows] = await connection.query<NextUrutRow[]>(
      "SELECT COALESCE(MAX(urutan_antrian), 0) + 1 AS next_urut FROM Tiket_Dapur"
    );
    const nextUrutan = maxUrutRows[0].next_urut;

    await connection.query(
      "INSERT INTO Tiket_Dapur (id_pesanan, urutan_antrian, status_tiket) VALUES (?, ?, 'menunggu')",
      [idPesanan, nextUrutan]
    );

    // 5. Update status meja jadi 'terisi' kalau dine in
    if (data.jenisLayanan === "dine_in" && data.idMeja) {
      await connection.query("UPDATE Meja SET status_meja = 'terisi' WHERE id_meja = ?", [data.idMeja]);
    }

    // 6. Kurangi stok bahan baku sesuai resep tiap menu yang dipesan
    for (const item of data.cartItems) {
      await connection.query(
        `UPDATE Bahan_Baku b
         JOIN Resep r ON r.id_bahan = b.id_bahan
         SET b.stok_tersedia = b.stok_tersedia - (r.jumlah_dibutuhkan * ?)
         WHERE r.id_menu = ?`,
        [item.jumlah, item.idMenu]
      );
    }

    // 7. Update status_stok otomatis berdasarkan sisa stok
    await connection.query(
      `UPDATE Bahan_Baku SET status_stok = CASE
         WHEN stok_tersedia <= 0 THEN 'habis'
         WHEN stok_tersedia <= batas_minimum THEN 'menipis'
         ELSE 'aman'
       END`
    );

    // 8. Nonaktifkan menu otomatis kalau bahan terkait habis
    await connection.query(
      `UPDATE Menu m
       JOIN Resep r ON r.id_menu = m.id_menu
       JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
       SET m.status_menu = 'nonaktif'
       WHERE b.status_stok = 'habis'`
    );

    await connection.commit();
    revalidatePath("/pemesanan");
    revalidatePath("/pesanan");
    revalidatePath("/antrian");
    revalidatePath("/stok");
    revalidatePath("/menu");

    return { success: true, idPesanan, nomorAntrian };
  } catch (error) {
    await connection.rollback();
    console.error("createPesananLengkap error:", error);
    return { success: false, message: "Gagal membuat pesanan" };
  } finally {
    connection.release();
  }
}

export async function updateStatusPesanan(idPesanan: number, statusBaru: StatusPesanan) {
  try {
    await pool.query("UPDATE Pesanan SET status_pesanan = ? WHERE id_pesanan = ?", [
      statusBaru,
      idPesanan,
    ]);
    revalidatePath("/penyajian");
    revalidatePath("/pesanan");
    return { success: true };
  } catch (error) {
    console.error("updateStatusPesanan error:", error);
    return { success: false };
  }
}

export async function getPesananList() {
  const [rows] = await pool.query<PesananListRow[]>(`
    SELECT
      p.id_karyawan, p.id_meja, p.id_pesanan, p.jenis_layanan, p.status_pesanan, p.waktu_pesan, p.total_tagihan,
      m.nomor_meja, p.nomor_antrian,
      (SELECT status_tiket FROM Tiket_Dapur t WHERE t.id_pesanan = p.id_pesanan ORDER BY t.id_tiket DESC LIMIT 1) AS status_tiket,
      dp.id_detail, dp.id_menu, dp.jumlah, dp.harga_satuan, dp.subtotal,
      menu.nama_menu
    FROM Pesanan p
    LEFT JOIN Meja m ON m.id_meja = p.id_meja
    LEFT JOIN Detail_Pesanan dp ON dp.id_pesanan = p.id_pesanan
    LEFT JOIN Menu menu ON menu.id_menu = dp.id_menu
    ORDER BY p.waktu_pesan DESC, dp.id_detail ASC
  `);

  const grouped = new Map<number, PesananGroup>();

  for (const row of rows) {
    if (!grouped.has(row.id_pesanan)) {
      grouped.set(row.id_pesanan, {
        idPesanan: row.id_pesanan,
        idKaryawan: row.id_karyawan,
        idMeja: row.id_meja ?? undefined,
        jenisLayanan: row.jenis_layanan,
        statusPesanan: row.status_pesanan,
        statusTiket: row.status_tiket ?? null,
        waktuPesan: row.waktu_pesan.toISOString(),
        totalTagihan: Number(row.total_tagihan),
        nomorMeja: row.nomor_meja ?? undefined,
        detailPesanan: [],
      });
    }

    const pesanan = grouped.get(row.id_pesanan);

    if (
      pesanan &&
      row.id_detail !== null &&
      row.id_menu !== null &&
      row.jumlah !== null &&
      row.harga_satuan !== null &&
      row.subtotal !== null &&
      row.nama_menu !== null
    ) {
      pesanan.detailPesanan.push({
        idDetail: row.id_detail,
        idPesanan: row.id_pesanan,
        idMenu: row.id_menu,
        namaMenu: row.nama_menu,
        jumlah: row.jumlah,
        hargaSatuan: Number(row.harga_satuan),
        subtotal: Number(row.subtotal),
      });
    }
  }

  return Array.from(grouped.values());
}

export async function getPesananSiapSaji() {
  const [rows] = await pool.query<PesananListRow[]>(`
    SELECT
      p.id_karyawan, p.id_meja, p.id_pesanan, p.jenis_layanan, p.status_pesanan, p.waktu_pesan, p.total_tagihan,
      m.nomor_meja, p.nomor_antrian,
      t.status_tiket,
      dp.id_detail, dp.id_menu, dp.jumlah, dp.harga_satuan, dp.subtotal,
      menu.nama_menu
    FROM Pesanan p
    JOIN (
      SELECT id_pesanan, status_tiket, waktu_selesai
      FROM Tiket_Dapur
      WHERE id_tiket IN (
        SELECT MAX(id_tiket) FROM Tiket_Dapur GROUP BY id_pesanan
      )
    ) t ON t.id_pesanan = p.id_pesanan
    LEFT JOIN Meja m ON m.id_meja = p.id_meja
    LEFT JOIN Detail_Pesanan dp ON dp.id_pesanan = p.id_pesanan
    LEFT JOIN Menu menu ON menu.id_menu = dp.id_menu
    WHERE t.status_tiket = 'selesai' AND p.status_pesanan = 'diproses'
    ORDER BY t.waktu_selesai ASC, dp.id_detail ASC
  `);

  const grouped = new Map<number, PesananGroup>();

  for (const row of rows) {
    if (!grouped.has(row.id_pesanan)) {
      grouped.set(row.id_pesanan, {
        idPesanan: row.id_pesanan,
        idKaryawan: row.id_karyawan,
        idMeja: row.id_meja ?? undefined,
        jenisLayanan: row.jenis_layanan,
        statusPesanan: row.status_pesanan,
        statusTiket: row.status_tiket ?? null,
        waktuPesan: row.waktu_pesan.toISOString(),
        totalTagihan: Number(row.total_tagihan),
        nomorMeja: row.nomor_meja ?? undefined,
        nomorAntrian: row.nomor_antrian ?? undefined,
        detailPesanan: [],
      });
    }

    const pesanan = grouped.get(row.id_pesanan);

    if (
      pesanan &&
      row.id_detail !== null &&
      row.id_menu !== null &&
      row.jumlah !== null &&
      row.harga_satuan !== null &&
      row.subtotal !== null &&
      row.nama_menu !== null
    ) {
      pesanan.detailPesanan.push({
        idDetail: row.id_detail,
        idPesanan: row.id_pesanan,
        idMenu: row.id_menu,
        namaMenu: row.nama_menu,
        jumlah: row.jumlah,
        hargaSatuan: Number(row.harga_satuan),
        subtotal: Number(row.subtotal),
      });
    }
  }

  return Array.from(grouped.values());
}

export async function cancelPesanan(idPesanan: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Cek dulu: pesanan boleh dibatalkan HANYA kalau tiket dapur masih 'menunggu'
    // (koki belum mulai masak). Kalau tiket sudah 'diproses' atau 'selesai', tolak.
    const [tiketRows] = await connection.query<TiketRow[]>(
      "SELECT id_tiket, status_tiket FROM Tiket_Dapur WHERE id_pesanan = ?",
      [idPesanan]
    );

    if (tiketRows.length > 0 && tiketRows[0].status_tiket !== "menunggu") {
      await connection.rollback();
      return {
        success: false,
        message: "Pesanan tidak bisa dibatalkan karena koki sudah mulai memasak",
      };
    }

    // Cek status pesanan itu sendiri - tidak boleh batalkan yang sudah selesai/disajikan
    const [pesananRows] = await connection.query<PesananRow[]>(
      "SELECT id_meja, status_pesanan FROM Pesanan WHERE id_pesanan = ?",
      [idPesanan]
    );
    const pesanan = pesananRows[0];

    if (!pesanan) {
      await connection.rollback();
      return { success: false, message: "Pesanan tidak ditemukan" };
    }

    if (["selesai", "dibatalkan"].includes(pesanan.status_pesanan)) {
      await connection.rollback();
      return { success: false, message: "Pesanan ini sudah tidak bisa dibatalkan" };
    }

    // 1. Kembalikan stok bahan baku sesuai resep menu yang dipesan
    const [detailRows] = await connection.query<DetailPesananRow[]>(
      "SELECT id_menu, jumlah FROM Detail_Pesanan WHERE id_pesanan = ?",
      [idPesanan]
    );
    for (const d of detailRows) {
      await connection.query(
        `UPDATE Bahan_Baku b JOIN Resep r ON r.id_bahan = b.id_bahan
         SET b.stok_tersedia = b.stok_tersedia + (r.jumlah_dibutuhkan * ?)
         WHERE r.id_menu = ?`,
        [d.jumlah, d.id_menu]
      );
    }

    // 2. Update status_stok otomatis (bisa jadi 'aman' lagi setelah stok kembali)
    await connection.query(
      `UPDATE Bahan_Baku SET status_stok = CASE
         WHEN stok_tersedia <= 0 THEN 'habis'
         WHEN stok_tersedia <= batas_minimum THEN 'menipis'
         ELSE 'aman' END`
    );

    // 3. Aktifkan kembali menu yang mungkin sempat nonaktif karena bahan habis
    await connection.query(
      `UPDATE Menu m
       JOIN Resep r ON r.id_menu = m.id_menu
       JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
       SET m.status_menu = 'aktif'
       WHERE m.status_menu = 'nonaktif'
         AND m.id_menu NOT IN (
           SELECT r2.id_menu FROM Resep r2
           JOIN Bahan_Baku b2 ON b2.id_bahan = r2.id_bahan
           WHERE b2.status_stok = 'habis'
         )`
    );

    // 4. Hapus tiket dapur (kalau ada)
    await connection.query("DELETE FROM Tiket_Dapur WHERE id_pesanan = ?", [idPesanan]);

    // 5. Update status pesanan jadi dibatalkan
    await connection.query(
      "UPDATE Pesanan SET status_pesanan = 'dibatalkan' WHERE id_pesanan = ?",
      [idPesanan]
    );

    // 6. Kosongkan meja JIKA tidak ada pesanan aktif lain di meja yang sama
    if (pesanan.id_meja) {
      const [pesananAktifRows] = await connection.query<JumlahPesananRow[]>(
        `SELECT COUNT(*) as jumlah FROM Pesanan
         WHERE id_meja = ? AND status_pesanan NOT IN ('selesai', 'dibatalkan')`,
        [pesanan.id_meja]
      );

      if (pesananAktifRows[0].jumlah === 0) {
        await connection.query("UPDATE Meja SET status_meja = 'kosong' WHERE id_meja = ?", [
          pesanan.id_meja,
        ]);
      }
    }

    await connection.commit();
    revalidatePath("/pesanan");
    revalidatePath("/antrian");
    revalidatePath("/stok");
    revalidatePath("/menu");
    revalidatePath("/status-meja");
    revalidatePath("/meja");
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("cancelPesanan error:", error);
    return { success: false, message: "Gagal membatalkan pesanan" };
  } finally {
    connection.release();
  }
}

/**
 * Ambil data pesanan untuk dimuat ke halaman Pemesanan saat mode edit.
 * Mengembalikan null kalau pesanan sudah tidak boleh diedit —
 * jadi kalau kasir memaksa buka /pemesanan?edit=xx, tetap ditolak.
 */
export async function getPesananForEdit(idPesanan: number): Promise<PesananEdit | null> {
  const [rows] = await pool.query<PesananEditRow[]>(
    `SELECT p.id_pesanan, p.id_meja, p.jenis_layanan, p.status_pesanan,
       (SELECT status_tiket FROM Tiket_Dapur t WHERE t.id_pesanan = p.id_pesanan
        ORDER BY t.id_tiket DESC LIMIT 1) AS status_tiket,
       (SELECT metode_pembayaran FROM Pembayaran pb WHERE pb.id_pesanan = p.id_pesanan
        ORDER BY pb.id_pembayaran DESC LIMIT 1) AS metode_pembayaran,
       (SELECT jumlah_bayar FROM Pembayaran pb WHERE pb.id_pesanan = p.id_pesanan
        ORDER BY pb.id_pembayaran DESC LIMIT 1) AS jumlah_bayar
     FROM Pesanan p
     WHERE p.id_pesanan = ?`,
    [idPesanan]
  );

  const pesanan = rows[0];
  if (!pesanan) return null;
  if (pesanan.status_pesanan !== "diproses") return null;
  if (pesanan.status_tiket !== null && pesanan.status_tiket !== "menunggu") return null;

  const [detailRows] = await pool.query<DetailEditRow[]>(
    `SELECT dp.id_menu, dp.jumlah, dp.harga_satuan, dp.catatan_item, m.nama_menu, m.gambar_url
     FROM Detail_Pesanan dp
     JOIN Menu m ON m.id_menu = dp.id_menu
     WHERE dp.id_pesanan = ?
     ORDER BY dp.id_detail ASC`,
    [idPesanan]
  );

  return {
    idPesanan: pesanan.id_pesanan,
    idMeja: pesanan.id_meja,
    jenisLayanan: pesanan.jenis_layanan,
    metodePembayaran: pesanan.metode_pembayaran ?? "",
    totalLama: Number(pesanan.jumlah_bayar ?? 0),
    items: detailRows.map((d) => ({
      idMenu: d.id_menu,
      namaMenu: d.nama_menu,
      harga: Number(d.harga_satuan), // pakai harga saat dipesan, bukan harga menu sekarang
      jumlah: d.jumlah,
      gambarUrl: d.gambar_url ?? undefined,
      catatanItem: d.catatan_item ?? undefined,
    })),
  };
}

export async function updatePesananLengkap(data: {
  idPesanan: number;
  idMeja: number | null;
  jenisLayanan: JenisLayanan;
  cartItems: CartItem[];
  metodePembayaran: "tunai" | "qris" | "edc";
  total: number;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validasi ulang di server, jangan cuma mengandalkan UI
    const [pesananRows] = await connection.query<PesananRow[]>(
      "SELECT id_meja, status_pesanan, nomor_antrian FROM Pesanan WHERE id_pesanan = ?",
      [data.idPesanan]
    );
    const pesananLama = pesananRows[0];

    if (!pesananLama) {
      await connection.rollback();
      return { success: false, message: "Pesanan tidak ditemukan" };
    }
    if (pesananLama.status_pesanan !== "diproses") {
      await connection.rollback();
      return { success: false, message: "Pesanan ini sudah tidak bisa diubah" };
    }
    if (data.cartItems.length === 0) {
      await connection.rollback();
      return { success: false, message: "Pesanan tidak boleh kosong" };
    }

    const [tiketRows] = await connection.query<TiketRow[]>(
      "SELECT id_tiket, status_tiket FROM Tiket_Dapur WHERE id_pesanan = ?",
      [data.idPesanan]
    );
    if (tiketRows.length > 0 && tiketRows[0].status_tiket !== "menunggu") {
      await connection.rollback();
      return {
        success: false,
        message: "Pesanan tidak bisa diubah karena koki sudah mulai memasak",
      };
    }

    // 2. Kembalikan stok dari item LAMA
    const [detailLama] = await connection.query<DetailPesananRow[]>(
      "SELECT id_menu, jumlah FROM Detail_Pesanan WHERE id_pesanan = ?",
      [data.idPesanan]
    );
    for (const d of detailLama) {
      await connection.query(
        `UPDATE Bahan_Baku b JOIN Resep r ON r.id_bahan = b.id_bahan
         SET b.stok_tersedia = b.stok_tersedia + (r.jumlah_dibutuhkan * ?)
         WHERE r.id_menu = ?`,
        [d.jumlah, d.id_menu]
      );
    }

    // 2b. Baru validasi stok SETELAH stok lama dikembalikan, supaya bahan
    //     yang "dipinjam" pesanan ini sendiri ikut dihitung sebagai tersedia
    const stokError = await cekStokCukup(connection, data.cartItems);
    if (stokError) {
      await connection.rollback();
      return { success: false, message: stokError };
    }

    // 3. Ganti seluruh isi Detail_Pesanan dengan item BARU
    await connection.query("DELETE FROM Detail_Pesanan WHERE id_pesanan = ?", [data.idPesanan]);
    for (const item of data.cartItems) {
      await connection.query(
        `INSERT INTO Detail_Pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal, catatan_item)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.idPesanan, item.idMenu, item.jumlah, item.harga, item.harga * item.jumlah, item.catatanItem ?? null]
      );
    }

    // 4. Potong stok untuk item BARU
    for (const item of data.cartItems) {
      await connection.query(
        `UPDATE Bahan_Baku b JOIN Resep r ON r.id_bahan = b.id_bahan
         SET b.stok_tersedia = b.stok_tersedia - (r.jumlah_dibutuhkan * ?)
         WHERE r.id_menu = ?`,
        [item.jumlah, item.idMenu]
      );
    }

    // 5. Hitung ulang status stok & status menu (dua arah: bisa habis, bisa aman lagi)
    await connection.query(
      `UPDATE Bahan_Baku SET status_stok = CASE
         WHEN stok_tersedia <= 0 THEN 'habis'
         WHEN stok_tersedia <= batas_minimum THEN 'menipis'
         ELSE 'aman' END`
    );
    await connection.query(
      `UPDATE Menu m
       JOIN Resep r ON r.id_menu = m.id_menu
       JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
       SET m.status_menu = 'aktif'
       WHERE m.status_menu = 'nonaktif'
         AND m.id_menu NOT IN (
           SELECT r2.id_menu FROM Resep r2
           JOIN Bahan_Baku b2 ON b2.id_bahan = r2.id_bahan
           WHERE b2.status_stok = 'habis'
         )`
    );
    await connection.query(
      `UPDATE Menu m
       JOIN Resep r ON r.id_menu = m.id_menu
       JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
       SET m.status_menu = 'nonaktif'
       WHERE b.status_stok = 'habis'`
    );

    // 6. Update data pesanan (meja, jenis layanan, total baru)
    const mejaBaru = data.jenisLayanan === "dine_in" ? data.idMeja : null;

    // Dine in → take away: dapat nomor antrian baru.
    // Take away → dine in: nomor antriannya dilepas jadi NULL.
    // Tetap take away: nomor lamanya dipertahankan supaya pelanggan tidak bingung.
    let nomorAntrian: string | null = null;
    if (data.jenisLayanan === "take_away") {
      nomorAntrian = pesananLama.nomor_antrian ?? (await buatNomorAntrian(connection));
    }

    await connection.query(
      "UPDATE Pesanan SET id_meja = ?, jenis_layanan = ?, nomor_antrian = ?, total_tagihan = ? WHERE id_pesanan = ?",
      [mejaBaru, data.jenisLayanan, nomorAntrian, data.total, data.idPesanan]
    );

    // 7. Update Pembayaran mengikuti total & metode baru
    const [bayarRows] = await connection.query<IdPembayaranRow[]>(
      "SELECT id_pembayaran FROM Pembayaran WHERE id_pesanan = ? ORDER BY id_pembayaran DESC LIMIT 1",
      [data.idPesanan]
    );
    if (bayarRows.length > 0) {
      await connection.query(
        `UPDATE Pembayaran SET metode_pembayaran = ?, jumlah_bayar = ?, status_pembayaran = 'berhasil'
         WHERE id_pembayaran = ?`,
        [data.metodePembayaran, data.total, bayarRows[0].id_pembayaran]
      );
    } else {
      await connection.query(
        `INSERT INTO Pembayaran (id_pesanan, metode_pembayaran, jumlah_bayar, status_pembayaran)
         VALUES (?, ?, ?, 'berhasil')`,
        [data.idPesanan, data.metodePembayaran, data.total]
      );
    }

    // 8. Sinkronkan status meja lama & baru (dijalankan SETELAH Pesanan di-update,
    //    supaya pesanan ini tidak ikut terhitung sebagai pesanan aktif di meja lama)
    const mejaLama = pesananLama.id_meja;
    if (mejaBaru) {
      await connection.query("UPDATE Meja SET status_meja = 'terisi' WHERE id_meja = ?", [mejaBaru]);
    }
    if (mejaLama && mejaLama !== mejaBaru) {
      const [pesananAktifRows] = await connection.query<JumlahPesananRow[]>(
        `SELECT COUNT(*) as jumlah FROM Pesanan
         WHERE id_meja = ? AND status_pesanan NOT IN ('selesai', 'dibatalkan')`,
        [mejaLama]
      );
      if (pesananAktifRows[0].jumlah === 0) {
        await connection.query("UPDATE Meja SET status_meja = 'kosong' WHERE id_meja = ?", [mejaLama]);
      }
    }

    await connection.commit();
    revalidatePath("/pemesanan");
    revalidatePath("/pesanan");
    revalidatePath("/antrian");
    revalidatePath("/stok");
    revalidatePath("/menu");
    revalidatePath("/meja");
    return { success: true, idPesanan: data.idPesanan, nomorAntrian };
  } catch (error) {
    await connection.rollback();
    console.error("updatePesananLengkap error:", error);
    return { success: false, message: "Gagal menyimpan perubahan pesanan" };
  } finally {
    connection.release();
  }
}

/**
 * Ambil data struk kasir. Dipakai untuk cetak pertama kali maupun cetak ulang,
 * jadi angkanya selalu diambil dari database — bukan dari state di layar.
 */
export async function getStrukKasir(idPesanan: number): Promise<StrukKasirData | null> {
  const [rows] = await pool.query<StrukKasirRow[]>(
    `SELECT p.id_pesanan, p.jenis_layanan, p.nomor_antrian, p.waktu_pesan, p.total_tagihan,
            m.nomor_meja, k.nama_karyawan,
            (SELECT metode_pembayaran FROM Pembayaran pb WHERE pb.id_pesanan = p.id_pesanan
             ORDER BY pb.id_pembayaran DESC LIMIT 1) AS metode_pembayaran
     FROM Pesanan p
     LEFT JOIN Meja m ON m.id_meja = p.id_meja
     LEFT JOIN Karyawan k ON k.id_karyawan = p.id_karyawan
     WHERE p.id_pesanan = ?`,
    [idPesanan]
  );

  const pesanan = rows[0];
  if (!pesanan) return null;

  const [itemRows] = await pool.query<StrukKasirItemRow[]>(
    `SELECT dp.jumlah, dp.harga_satuan, dp.subtotal, dp.catatan_item, m.nama_menu
     FROM Detail_Pesanan dp
     JOIN Menu m ON m.id_menu = dp.id_menu
     WHERE dp.id_pesanan = ?
     ORDER BY dp.id_detail ASC`,
    [idPesanan]
  );

  const subtotal = itemRows.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const total = Number(pesanan.total_tagihan);

  return {
    idPesanan: pesanan.id_pesanan,
    jenisLayanan: pesanan.jenis_layanan,
    nomorMeja: pesanan.nomor_meja ?? undefined,
    nomorAntrian: pesanan.nomor_antrian ?? undefined,
    namaKasir: pesanan.nama_karyawan ?? undefined,
    waktuPesan: pesanan.waktu_pesan.toISOString(),
    metodePembayaran: pesanan.metode_pembayaran ?? "-",
    items: itemRows.map((i) => ({
      namaMenu: i.nama_menu,
      jumlah: i.jumlah,
      hargaSatuan: Number(i.harga_satuan),
      subtotal: Number(i.subtotal),
      catatanItem: i.catatan_item ?? undefined,
    })),
    subtotal,
    // Pajak tidak disimpan terpisah di database, jadi diturunkan dari selisihnya.
    // Konsisten karena total = subtotal + pajak (diskon masih 0).
    pajak: Math.max(0, total - subtotal),
    total,
  };
}