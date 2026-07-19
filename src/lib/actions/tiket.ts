"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { JenisLayanan, StatusPesanan, StatusTiket } from "@/lib/types";

interface AntrianDapurRow extends RowDataPacket {
  id_tiket: number;
  id_pesanan: number;
  status_tiket: StatusTiket;
  waktu_masuk_dapur: Date;

  jenis_layanan: JenisLayanan;
  nomor_meja: string | null;

  id_detail: number;
  id_menu: number;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  catatan_item: string | null;

  nama_menu: string;
}

interface AntrianDapurGroup {
  idTiket: number;
  idPesanan: number;
  statusTiket: StatusTiket;
  waktuMasukDapur: string;
  statusPesanan: StatusPesanan;
  jenisLayanan: JenisLayanan;
  nomorMeja: string | null;

  detailPesanan: {
    idDetail: number;
    idPesanan: number;
    idMenu: number;
    namaMenu: string;
    jumlah: number;
    hargaSatuan: number;
    subtotal: number;
    catatanItem?: string;
  }[];
}

export async function updateStatusTiket(idTiket: number, statusBaru: StatusTiket) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const waktuSelesai = statusBaru === "selesai" ? new Date() : null;

    await connection.query(
      "UPDATE Tiket_Dapur SET status_tiket = ?, waktu_selesai = ? WHERE id_tiket = ?",
      [statusBaru, waktuSelesai, idTiket]
    );

    // PENTING: status_pesanan TIDAK diubah di sini.
    // Koki menandai tiket "selesai" berarti masakan sudah siap,
    // tapi pesanan baru benar-benar "selesai" setelah PELAYAN
    // mengantarkannya ke pelanggan (lihat updateStatusPesanan di pesanan.ts).

    await connection.commit();
    revalidatePath("/antrian");
    revalidatePath("/penyajian");
    revalidatePath("/pesanan");
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("updateStatusTiket error:", error);
    return { success: false };
  } finally {
    connection.release();
  }
}

export async function getAntrianDapur() {
  const [rows] = await pool.query<AntrianDapurRow[]>(`
    SELECT
      t.id_tiket, t.id_pesanan, t.status_tiket, t.waktu_masuk_dapur,
      p.jenis_layanan, m.nomor_meja, p.status_pesanan,
      dp.id_detail, dp.id_menu, dp.jumlah, dp.harga_satuan, dp.subtotal, dp.catatan_item,
      menu.nama_menu
    FROM Tiket_Dapur t
    JOIN Pesanan p ON p.id_pesanan = t.id_pesanan
    LEFT JOIN Meja m ON m.id_meja = p.id_meja
    JOIN Detail_Pesanan dp ON dp.id_pesanan = t.id_pesanan
    JOIN Menu menu ON menu.id_menu = dp.id_menu
    WHERE p.status_pesanan NOT IN ('selesai', 'dibatalkan')
    ORDER BY t.urutan_antrian ASC, dp.id_detail ASC
  `);

  const grouped = new Map<number, AntrianDapurGroup>();

  for (const row of rows) {
    if (!grouped.has(row.id_tiket)) {
      grouped.set(row.id_tiket, {
        idTiket: row.id_tiket,
        idPesanan: row.id_pesanan,
        statusTiket: row.status_tiket,
        statusPesanan: row.status_pesanan,
        waktuMasukDapur: row.waktu_masuk_dapur.toISOString(),
        jenisLayanan: row.jenis_layanan,
        nomorMeja: row.nomor_meja,
        detailPesanan: [],
      });
    }

    const tiket = grouped.get(row.id_tiket);

    if (tiket) {
      tiket.detailPesanan.push({
        idDetail: row.id_detail,
        idPesanan: row.id_pesanan,
        idMenu: row.id_menu,
        namaMenu: row.nama_menu,
        jumlah: row.jumlah,
        hargaSatuan: Number(row.harga_satuan),
        subtotal: Number(row.subtotal),
        catatanItem: row.catatan_item ?? undefined,
      });
    }
  }

  return Array.from(grouped.values());
}