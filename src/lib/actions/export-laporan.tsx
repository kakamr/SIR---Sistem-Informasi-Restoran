"use server";

import ExcelJS from "exceljs";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { JenisLayanan, StatusPesanan, MetodePembayaran, StatusPembayaran } from "@/lib/types";
import { renderToBuffer } from "@react-pdf/renderer";
import LaporanPdfDocument from "@/components/kasir/LaporanPdfDocument";

interface LaporanPdfRow extends RowDataPacket {
  id_pesanan: number;
  waktu_pesan: Date;
  status_pesanan: StatusPesanan;
  total_tagihan: number;
  nomor_meja: string | null;
}

interface LaporanExcelRow extends RowDataPacket {
  id_pesanan: number;
  jenis_layanan: JenisLayanan;
  status_pesanan: StatusPesanan;
  waktu_pesan: Date;
  total_tagihan: number;
  nomor_meja: string | null;
  metode_pembayaran: MetodePembayaran | null;
  status_pembayaran: StatusPembayaran | null;
}

interface MenuTerlarisRow extends RowDataPacket {
  nama_menu: string;
  total_terjual: number;
  total_pendapatan: number;
}

export async function generateLaporanPdf(periodeMulai: string, periodeSelesai: string) {
  const [rows] = await pool.query<LaporanPdfRow[]>(
    `SELECT p.id_pesanan, p.waktu_pesan, p.status_pesanan, p.total_tagihan, m.nomor_meja
     FROM Pesanan p LEFT JOIN Meja m ON m.id_meja = p.id_meja
     WHERE DATE(p.waktu_pesan) BETWEEN ? AND ?
     ORDER BY p.waktu_pesan ASC`,
    [periodeMulai, periodeSelesai]
  );

  const transaksi = rows.map((r) => ({
    id: r.id_pesanan,
    tanggal: new Date(r.waktu_pesan).toLocaleDateString("id-ID"),
    meja: r.nomor_meja ?? "Take Away",
    total: Number(r.total_tagihan),
    status: r.status_pesanan,
  }));

  const totalPendapatan = transaksi.reduce((sum, t) => sum + t.total, 0);

  const buffer = await renderToBuffer(
    <LaporanPdfDocument
      periodeMulai={periodeMulai}
      periodeSelesai={periodeSelesai}
      totalPendapatan={totalPendapatan}
      totalTransaksi={transaksi.length}
      transaksi={transaksi}
    />
  );

  return {
    success: true,
    base64: buffer.toString("base64"),
    fileName: `Laporan_SIR_${periodeMulai}_${periodeSelesai}.pdf`,
  };
}

export async function generateLaporanExcel(periodeMulai: string, periodeSelesai: string) {
  const [transaksiRows] = await pool.query<LaporanExcelRow[]>(
    `SELECT p.id_pesanan, p.jenis_layanan, p.status_pesanan, p.waktu_pesan, p.total_tagihan,
            m.nomor_meja, pb.metode_pembayaran, pb.status_pembayaran
     FROM Pesanan p
     LEFT JOIN Meja m ON m.id_meja = p.id_meja
     LEFT JOIN Pembayaran pb ON pb.id_pesanan = p.id_pesanan
     WHERE DATE(p.waktu_pesan) BETWEEN ? AND ?
     ORDER BY p.waktu_pesan ASC`,
    [periodeMulai, periodeSelesai]
  );

  const [menuTerlarisRows] = await pool.query<MenuTerlarisRow[]>(
    `SELECT menu.nama_menu, SUM(dp.jumlah) as total_terjual, SUM(dp.subtotal) as total_pendapatan
     FROM Detail_Pesanan dp
     JOIN Menu menu ON menu.id_menu = dp.id_menu
     JOIN Pesanan p ON p.id_pesanan = dp.id_pesanan
     WHERE DATE(p.waktu_pesan) BETWEEN ? AND ?
     GROUP BY dp.id_menu
     ORDER BY total_terjual DESC
     LIMIT 10`,
    [periodeMulai, periodeSelesai]
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIR - Sistem Informasi Restoran";
  workbook.created = new Date();

  // ---------- Sheet 1: Ringkasan Transaksi ----------
  const sheetTransaksi = workbook.addWorksheet("Transaksi");
  sheetTransaksi.columns = [
    { header: "ID Pesanan", key: "id_pesanan", width: 12 },
    { header: "Tanggal", key: "waktu_pesan", width: 20 },
    { header: "Meja", key: "nomor_meja", width: 10 },
    { header: "Jenis Layanan", key: "jenis_layanan", width: 15 },
    { header: "Metode Bayar", key: "metode_pembayaran", width: 15 },
    { header: "Status", key: "status_pesanan", width: 15 },
    { header: "Total", key: "total_tagihan", width: 15 },
  ];
  sheetTransaksi.getRow(1).font = { bold: true };
  sheetTransaksi.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2D5A4A" },
  };
  sheetTransaksi.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  transaksiRows.forEach((row) => {
    sheetTransaksi.addRow({
      id_pesanan: row.id_pesanan,
      waktu_pesan: new Date(row.waktu_pesan).toLocaleString("id-ID"),
      nomor_meja: row.nomor_meja ?? "Take Away",
      jenis_layanan: row.jenis_layanan,
      metode_pembayaran: row.metode_pembayaran ?? "-",
      status_pesanan: row.status_pesanan,
      total_tagihan: Number(row.total_tagihan),
    });
  });

  sheetTransaksi.getColumn("total_tagihan").numFmt = '"Rp"#,##0';

  // ---------- Sheet 2: Menu Terlaris ----------
  const sheetMenu = workbook.addWorksheet("Menu Terlaris");
  sheetMenu.columns = [
    { header: "Nama Menu", key: "nama_menu", width: 30 },
    { header: "Jumlah Terjual", key: "total_terjual", width: 18 },
    { header: "Total Pendapatan", key: "total_pendapatan", width: 20 },
  ];
  sheetMenu.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetMenu.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2D5A4A" },
  };

  menuTerlarisRows.forEach((row) => {
    sheetMenu.addRow({
      nama_menu: row.nama_menu,
      total_terjual: row.total_terjual,
      total_pendapatan: Number(row.total_pendapatan),
    });
  });
  sheetMenu.getColumn("total_pendapatan").numFmt = '"Rp"#,##0';

  const buffer = await workbook.xlsx.writeBuffer();

  // Server Action tidak bisa langsung "download" file ke browser,
  // jadi kita return base64 dan biarkan client yang trigger download
  return {
    success: true,
    base64: Buffer.from(buffer).toString("base64"),
    fileName: `Laporan_SIR_${periodeMulai}_${periodeSelesai}.xlsx`,
  };
}