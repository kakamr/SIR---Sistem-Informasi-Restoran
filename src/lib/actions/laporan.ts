"use server";

import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { LaporanSummary, JenisLayanan, StatusPesanan} from "@/lib/types";

interface JumlahRow extends RowDataPacket {
  jumlah: number;
}

interface TotalSaleRow extends RowDataPacket {
  total: number;
}

interface RevenueByMonthRow extends RowDataPacket {
  bulan: string;
  total: number;
}

interface TransaksiHariIniRow extends RowDataPacket {
  orderHariIni: number;
  selesai: number;
  diproses: number;
  batal: number;
}

interface PesananTerbaruRow extends RowDataPacket {
  id_pesanan: number;
  jenis_layanan: JenisLayanan;
  status_pesanan: StatusPesanan;
  waktu_pesan: Date;
  total_tagihan: number;
}

interface CustomerSourceRow extends RowDataPacket {
  online: number;
  onShop: number;
}

interface MenuTerlarisRow extends RowDataPacket {
  nama_menu: string;
  total_terjual: number;
}

export async function getLaporanSummary(): Promise<LaporanSummary> {
  const [
    [[menuTersediaRow]],
    [[totalPesananRow]],
    [[saleRow]],
    [revenueByMonthRows],
    [[transaksiHariIniRow]],
    [pesananTerbaruRows],
    [[customerSourceRow]],
    [menuTerlarisRows], // tambahan untuk bug 4
  ] = await Promise.all([
    pool.query<JumlahRow[]>("SELECT COUNT(*) as jumlah FROM Menu WHERE status_menu = 'aktif'"),
    pool.query<JumlahRow[]>("SELECT COUNT(*) as jumlah FROM Pesanan"),
    // Perbaikan: JOIN ke Pesanan, exclude yang statusnya 'dibatalkan'
    pool.query<TotalSaleRow[]>(`
      SELECT COALESCE(SUM(pb.jumlah_bayar),0) as total
      FROM Pembayaran pb
      JOIN Pesanan p ON p.id_pesanan = pb.id_pesanan
      WHERE pb.status_pembayaran = 'berhasil' AND p.status_pesanan != 'dibatalkan'
    `),
    // Perbaikan yang sama di grafik revenue bulanan
    pool.query<RevenueByMonthRow[]>(`
      SELECT DATE_FORMAT(pb.waktu_bayar, '%b') as bulan, SUM(pb.jumlah_bayar) as total
      FROM Pembayaran pb
      JOIN Pesanan p ON p.id_pesanan = pb.id_pesanan
      WHERE pb.status_pembayaran = 'berhasil' AND p.status_pesanan != 'dibatalkan'
      GROUP BY MONTH(pb.waktu_bayar), DATE_FORMAT(pb.waktu_bayar, '%b')
      ORDER BY MONTH(pb.waktu_bayar) ASC
    `),
    pool.query<TransaksiHariIniRow[]>(`
      SELECT
        COUNT(*) as orderHariIni,
        SUM(CASE WHEN status_pesanan = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN status_pesanan = 'diproses' THEN 1 ELSE 0 END) as diproses,
        SUM(CASE WHEN status_pesanan = 'dibatalkan' THEN 1 ELSE 0 END) as batal
      FROM Pesanan
      WHERE DATE(waktu_pesan) = CURDATE()
    `),
    pool.query<PesananTerbaruRow[]>(`
      SELECT id_pesanan, jenis_layanan, status_pesanan, waktu_pesan, total_tagihan
      FROM Pesanan ORDER BY waktu_pesan DESC LIMIT 5
    `),
    pool.query<CustomerSourceRow[]>(`
      SELECT
        SUM(CASE WHEN sumber_pesanan = 'online' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN sumber_pesanan = 'on_shop' THEN 1 ELSE 0 END) as onShop
      FROM Pesanan
      WHERE status_pesanan != 'dibatalkan'
    `),
    // Query baru: menu terlaris berdasarkan total jumlah terjual, exclude pesanan dibatalkan
    pool.query<MenuTerlarisRow[]>(`
      SELECT m.nama_menu, SUM(dp.jumlah) as total_terjual
      FROM Detail_Pesanan dp
      JOIN Menu m ON m.id_menu = dp.id_menu
      JOIN Pesanan p ON p.id_pesanan = dp.id_pesanan
      WHERE p.status_pesanan != 'dibatalkan'
      GROUP BY dp.id_menu, m.nama_menu
      ORDER BY total_terjual DESC
      LIMIT 1
    `),
  ]);

  return {
    menuTersedia: menuTersediaRow.jumlah,
    totalPesanan: totalPesananRow.jumlah,
    totalSale: Number(saleRow.total),
    totalProfit: 0,
    customerOnline: customerSourceRow.online ?? 0,
    customerOnShop: customerSourceRow.onShop ?? 0,
    menuTerlaris: menuTerlarisRows[0]?.nama_menu ?? "Belum ada data",
    revenueByMonth: revenueByMonthRows.map((r) => ({ bulan: r.bulan, total: Number(r.total) })),
    transaksiHariIni: {
      orderHariIni: transaksiHariIniRow.orderHariIni ?? 0,
      selesai: transaksiHariIniRow.selesai ?? 0,
      diproses: transaksiHariIniRow.diproses ?? 0,
      batal: transaksiHariIniRow.batal ?? 0,
    },
    pesananTerbaru: pesananTerbaruRows.map((p) => ({
      idPesanan: p.id_pesanan,
      idKaryawan: 0,
      jenisLayanan: p.jenis_layanan,
      statusPesanan: p.status_pesanan,
      waktuPesan: p.waktu_pesan.toISOString(),
      totalTagihan: Number(p.total_tagihan),
    })),
  };
}