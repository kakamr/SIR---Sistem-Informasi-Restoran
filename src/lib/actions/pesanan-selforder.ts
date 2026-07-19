"use server";

import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { CartItemSelfOrder, MetodePembayaranSelfOrder } from "@/lib/types";

interface PembayaranStatusRow extends RowDataPacket {
  id_pembayaran: number;
  id_pesanan: number;
  metode_pembayaran: string;
  jumlah_bayar: number;
  status_pembayaran: "menunggu" | "berhasil" | "gagal";
  id_meja: number;
  nomor_meja: string;
  kode_akses: string;
}

interface IdPesananRow extends RowDataPacket {
  id_pesanan: number;
}

interface NextUrutRow extends RowDataPacket {
  next_urut: number;
}

interface DetailPesananRow extends RowDataPacket {
  id_menu: number;
  jumlah: number;
}

interface StrukPembayaranRow extends RowDataPacket {
  id_pembayaran: number;
  id_pesanan: number;
  metode_pembayaran: string;
  jumlah_bayar: number;
  status_pembayaran: string;
  waktu_bayar: Date;
  id_meja: number;
  nomor_meja: string;
}

interface StrukItemRow extends RowDataPacket {
  nama_menu: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  catatan_item: string | null;
}

export async function createPesananSelfOrder(data: {
  idMeja: number;
  cartItems: CartItemSelfOrder[];
  metodePembayaran: MetodePembayaranSelfOrder;
  total: number;
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // idKaryawan diisi karyawan "sistem" placeholder — sesuaikan kalau ada akun khusus self-order
    const [pesananResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Pesanan (id_meja, id_karyawan, jenis_layanan, sumber_pesanan, status_pesanan, total_tagihan)
      VALUES (?, 1, 'dine_in', 'online', 'menunggu_bayar', ?)`,
      [data.idMeja, data.total]
    );
    const idPesanan = pesananResult.insertId;

    for (const item of data.cartItems) {
      await connection.query(
        `INSERT INTO Detail_Pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal, catatan_item)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idPesanan, item.idMenu, item.jumlah, item.harga, item.harga * item.jumlah, item.catatanItem ?? null]
      );
    }

    const [pembayaranResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO Pembayaran (id_pesanan, metode_pembayaran, jumlah_bayar, status_pembayaran)
       VALUES (?, ?, ?, 'menunggu')`,
      [idPesanan, data.metodePembayaran, data.total]
    );
    const idPembayaran = pembayaranResult.insertId;

    await connection.commit();
    return { success: true, idPesanan, idPembayaran };
  } catch (error) {
    await connection.rollback();
    console.error("createPesananSelfOrder error:", error);
    return { success: false, message: "Gagal membuat pesanan" };
  } finally {
    connection.release();
  }
}

export async function getPembayaranStatus(idPembayaran: number) {
  const [rows] = await pool.query<PembayaranStatusRow[]>(
    `SELECT p.id_pembayaran, p.id_pesanan, p.metode_pembayaran, p.jumlah_bayar, p.status_pembayaran,
            ps.id_meja, m.nomor_meja, m.kode_akses
     FROM Pembayaran p
     JOIN Pesanan ps ON ps.id_pesanan = p.id_pesanan
     LEFT JOIN Meja m ON m.id_meja = ps.id_meja
     WHERE p.id_pembayaran = ?`,
    [idPembayaran]
  );
  return rows[0] ?? null;
}

/**
 * Simulasi webhook payment gateway.
 * Nanti di produksi ini dipanggil oleh webhook Midtrans/Xendit dsb,
 * bukan dipanggil dari client dengan setTimeout.
 */
export async function confirmPembayaranSelfOrder(idPembayaran: number) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<IdPesananRow[]>(
      "SELECT id_pesanan FROM Pembayaran WHERE id_pembayaran = ?",
      [idPembayaran]
    );
    const idPesanan = rows[0]?.id_pesanan;
    if (!idPesanan) throw new Error("Pembayaran tidak ditemukan");

    await connection.query(
      "UPDATE Pembayaran SET status_pembayaran = 'berhasil' WHERE id_pembayaran = ?",
      [idPembayaran]
    );

    await connection.query(
      "UPDATE Pesanan SET status_pesanan = 'diproses' WHERE id_pesanan = ?",
      [idPesanan]
    );

    // Baru sekarang tiket dapur dibuat, karena self-order baru boleh masuk dapur setelah bayar
    const [maxUrutRows] = await connection.query<NextUrutRow[]>(
      "SELECT COALESCE(MAX(urutan_antrian), 0) + 1 AS next_urut FROM Tiket_Dapur"
    );
    await connection.query(
      "INSERT INTO Tiket_Dapur (id_pesanan, urutan_antrian, status_tiket) VALUES (?, ?, 'menunggu')",
      [idPesanan, maxUrutRows[0].next_urut]
    );

    await connection.query("UPDATE Meja SET status_meja = 'terisi' WHERE id_meja = (SELECT id_meja FROM Pesanan WHERE id_pesanan = ?)", [idPesanan]);

    // Kurangi stok + update status stok/menu (sama seperti alur kasir)
    const [detailRows] = await connection.query<DetailPesananRow[]>(
      "SELECT id_menu, jumlah FROM Detail_Pesanan WHERE id_pesanan = ?",
      [idPesanan]
    );
    for (const d of detailRows) {
      await connection.query(
        `UPDATE Bahan_Baku b JOIN Resep r ON r.id_bahan = b.id_bahan
         SET b.stok_tersedia = b.stok_tersedia - (r.jumlah_dibutuhkan * ?)
         WHERE r.id_menu = ?`,
        [d.jumlah, d.id_menu]
      );
    }
    await connection.query(
      `UPDATE Bahan_Baku SET status_stok = CASE
         WHEN stok_tersedia <= 0 THEN 'habis'
         WHEN stok_tersedia <= batas_minimum THEN 'menipis'
         ELSE 'aman' END`
    );
    await connection.query(
      `UPDATE Menu m JOIN Resep r ON r.id_menu = m.id_menu JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
       SET m.status_menu = 'nonaktif' WHERE b.status_stok = 'habis'`
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("confirmPembayaranSelfOrder error:", error);
    return { success: false };
  } finally {
    connection.release();
  }
}

export async function getStrukData(idPembayaran: number) {
  const [rows] = await pool.query<StrukPembayaranRow[]>(
    `SELECT p.id_pembayaran, p.id_pesanan, p.metode_pembayaran, p.jumlah_bayar, p.status_pembayaran, p.waktu_bayar,
            ps.id_meja, m.nomor_meja
     FROM Pembayaran p
     JOIN Pesanan ps ON ps.id_pesanan = p.id_pesanan
     LEFT JOIN Meja m ON m.id_meja = ps.id_meja
     WHERE p.id_pembayaran = ?`,
    [idPembayaran]
  );

  const pembayaran = rows[0];
  if (!pembayaran) return null;

  const [detailRows] = await pool.query<StrukItemRow[]>(
    `SELECT dp.jumlah, dp.harga_satuan, dp.subtotal, dp.catatan_item, m.nama_menu
     FROM Detail_Pesanan dp
     JOIN Menu m ON m.id_menu = dp.id_menu
     WHERE dp.id_pesanan = ?
     ORDER BY dp.id_detail ASC`,
    [pembayaran.id_pesanan]
  );

  return {
    idPembayaran: pembayaran.id_pembayaran,
    nomorMeja: pembayaran.nomor_meja,
    tanggal: pembayaran.waktu_bayar.toISOString(),
    metodePembayaran: pembayaran.metode_pembayaran,
    totalPembayaran: Number(pembayaran.jumlah_bayar),
    items: detailRows.map((d) => ({
      namaMenu: d.nama_menu,
      jumlah: d.jumlah,
      hargaSatuan: Number(d.harga_satuan),
      subtotal: Number(d.subtotal),
      catatanItem: d.catatan_item ?? undefined,
    })),
  };
}