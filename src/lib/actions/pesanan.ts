"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { DetailPesanan, CartItem, JenisLayanan, StatusPesanan, StatusTiket } from "@/lib/types";

interface NextUrutRow extends RowDataPacket {
  next_urut: number;
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
}

interface DetailPesananRow extends RowDataPacket {
  id_menu: number;
  jumlah: number;
}

interface JumlahPesananRow extends RowDataPacket {
  jumlah: number;
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

    // 1. Insert Pesanan
    const [pesananResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Pesanan (id_meja, id_karyawan, jenis_layanan, sumber_pesanan, status_pesanan, total_tagihan)
      VALUES (?, ?, ?, 'on_shop', 'diproses', ?)`,
      [data.idMeja, data.idKaryawan, data.jenisLayanan, data.total]
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

    return { success: true, idPesanan };
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
      m.nomor_meja,
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
      m.nomor_meja,
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

    if (["selesai", "disajikan", "dibatalkan"].includes(pesanan.status_pesanan)) {
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