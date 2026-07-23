"use server";

import ExcelJS from "exceljs";
import { renderToBuffer } from "@react-pdf/renderer";
import pool from "@/lib/db";
import LaporanPdfDocument from "@/components/kasir/LaporanPdfDocument";

interface RawDataRow {
  id_pesanan: number;
  waktu_pesan: Date;
  nama_pelanggan: string | null;
  nomor_meja: string | null;
  jenis_layanan: string;
  sumber_pesanan: string;
  nama_kasir: string | null;
  status_pesanan: string;
  nama_menu: string;
  jumlah: number;
  harga_satuan: number;
  subtotal: number;
  catatan_item: string | null;
  metode_pembayaran: string | null;
  status_pembayaran: string | null;
}

async function fetchRawData(periodeMulai: string, periodeSelesai: string): Promise<RawDataRow[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
      p.id_pesanan,
      p.waktu_pesan,
      pel.nama_pelanggan,
      m.nomor_meja,
      p.jenis_layanan,
      p.sumber_pesanan,
      k.nama_karyawan AS nama_kasir,
      p.status_pesanan,
      menu.nama_menu,
      dp.jumlah,
      dp.harga_satuan,
      dp.subtotal,
      dp.catatan_item,
      pb.metode_pembayaran,
      pb.status_pembayaran
     FROM Pesanan p
     JOIN Detail_Pesanan dp ON dp.id_pesanan = p.id_pesanan
     JOIN Menu menu ON menu.id_menu = dp.id_menu
     LEFT JOIN Pelanggan pel ON pel.id_pelanggan = p.id_pelanggan
     LEFT JOIN Meja m ON m.id_meja = p.id_meja
     LEFT JOIN Karyawan k ON k.id_karyawan = p.id_karyawan AND p.sumber_pesanan = 'on_shop'
     LEFT JOIN Pembayaran pb ON pb.id_pesanan = p.id_pesanan
     WHERE DATE(p.waktu_pesan) BETWEEN ? AND ?
     ORDER BY p.waktu_pesan ASC, p.id_pesanan ASC`,
    [periodeMulai, periodeSelesai]
  );

  return rows as RawDataRow[];
}

const JENIS_LAYANAN_LABEL: Record<string, string> = {
  dine_in: "Dine In",
  take_away: "Take Away",
};

const SUMBER_LABEL: Record<string, string> = {
  online: "Self-Order (Online)",
  on_shop: "Kasir (On-Shop)",
};

const STATUS_LABEL: Record<string, string> = {
  menunggu_bayar: "Menunggu Bayar",
  diproses: "Diproses",
  disajikan: "Disajikan",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export async function generateLaporanExcel(periodeMulai: string, periodeSelesai: string, label: string) {
  const rawData = await fetchRawData(periodeMulai, periodeSelesai);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIR - Sistem Informasi Restoran";
  workbook.created = new Date();

  // ---------- Sheet 1: Data Mentah (satu baris per item pesanan) ----------
  const sheetRaw = workbook.addWorksheet("Data Transaksi");
  sheetRaw.columns = [
    { header: "ID Pesanan", key: "id_pesanan", width: 12 },
    { header: "Tanggal & Waktu", key: "waktu", width: 20 },
    { header: "Pelanggan", key: "pelanggan", width: 20 },
    { header: "Meja", key: "meja", width: 10 },
    { header: "Jenis Layanan", key: "jenis_layanan", width: 14 },
    { header: "Sumber Pesanan", key: "sumber", width: 18 },
    { header: "Kasir", key: "kasir", width: 18 },
    { header: "Status Pesanan", key: "status_pesanan", width: 15 },
    { header: "Menu", key: "menu", width: 25 },
    { header: "Jumlah", key: "jumlah", width: 10 },
    { header: "Harga Satuan", key: "harga_satuan", width: 15 },
    { header: "Subtotal", key: "subtotal", width: 15 },
    { header: "Catatan Item", key: "catatan", width: 25 },
    { header: "Metode Bayar", key: "metode_bayar", width: 14 },
    { header: "Status Bayar", key: "status_bayar", width: 14 },
  ];
  sheetRaw.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetRaw.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5A4A" } };

  rawData.forEach((row) => {
    sheetRaw.addRow({
      id_pesanan: row.id_pesanan,
      waktu: new Date(row.waktu_pesan).toLocaleString("id-ID"),
      pelanggan: row.nama_pelanggan ?? "Guest / Walk-in",
      meja: row.nomor_meja ?? "Take Away",
      jenis_layanan: JENIS_LAYANAN_LABEL[row.jenis_layanan] ?? row.jenis_layanan,
      sumber: SUMBER_LABEL[row.sumber_pesanan] ?? row.sumber_pesanan,
      kasir: row.nama_kasir ?? "-",
      status_pesanan: STATUS_LABEL[row.status_pesanan] ?? row.status_pesanan,
      menu: row.nama_menu,
      jumlah: row.jumlah,
      harga_satuan: Number(row.harga_satuan),
      subtotal: Number(row.subtotal),
      catatan: row.catatan_item ?? "-",
      metode_bayar: row.metode_pembayaran ?? "-",
      status_bayar: row.status_pembayaran ?? "-",
    });
  });
  sheetRaw.getColumn("harga_satuan").numFmt = '"Rp"#,##0';
  sheetRaw.getColumn("subtotal").numFmt = '"Rp"#,##0';

  // ---------- Sheet 2: Ringkasan per Menu ----------
  const menuMap = new Map<string, { jumlah: number; total: number }>();
  for (const row of rawData) {
    if (row.status_pesanan === "dibatalkan") continue;
    const existing = menuMap.get(row.nama_menu) ?? { jumlah: 0, total: 0 };
    existing.jumlah += row.jumlah;
    existing.total += Number(row.subtotal);
    menuMap.set(row.nama_menu, existing);
  }

  const sheetMenu = workbook.addWorksheet("Ringkasan Menu");
  sheetMenu.columns = [
    { header: "Nama Menu", key: "nama_menu", width: 30 },
    { header: "Jumlah Terjual", key: "jumlah", width: 18 },
    { header: "Total Pendapatan", key: "total", width: 20 },
  ];
  sheetMenu.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetMenu.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5A4A" } };

  Array.from(menuMap.entries())
    .sort((a, b) => b[1].jumlah - a[1].jumlah)
    .forEach(([nama_menu, v]) => {
      sheetMenu.addRow({ nama_menu, jumlah: v.jumlah, total: v.total });
    });
  sheetMenu.getColumn("total").numFmt = '"Rp"#,##0';

  // ---------- Sheet 3: Ringkasan Umum ----------
  const totalTransaksi = new Set(rawData.filter((r) => r.status_pesanan !== "dibatalkan").map((r) => r.id_pesanan)).size;
  const totalPendapatan = rawData
    .filter((r) => r.status_pesanan !== "dibatalkan")
    .reduce((sum, r) => sum + Number(r.subtotal), 0);
  const totalOnline = new Set(
    rawData.filter((r) => r.sumber_pesanan === "online" && r.status_pesanan !== "dibatalkan").map((r) => r.id_pesanan)
  ).size;
  const totalOnShop = new Set(
    rawData.filter((r) => r.sumber_pesanan === "on_shop" && r.status_pesanan !== "dibatalkan").map((r) => r.id_pesanan)
  ).size;
  const totalDibatalkan = new Set(
    rawData.filter((r) => r.status_pesanan === "dibatalkan").map((r) => r.id_pesanan)
  ).size;

  const sheetSummary = workbook.addWorksheet("Ringkasan");
  sheetSummary.columns = [
    { header: "Keterangan", key: "keterangan", width: 30 },
    { header: "Nilai", key: "nilai", width: 25 },
  ];
  sheetSummary.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheetSummary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D5A4A" } };
  sheetSummary.addRow({ keterangan: "Periode", nilai: label });
  sheetSummary.addRow({ keterangan: "Total Transaksi (Valid)", nilai: totalTransaksi });
  sheetSummary.addRow({ keterangan: "Total Pendapatan", nilai: totalPendapatan });
  sheetSummary.addRow({ keterangan: "Transaksi Self-Order (Online)", nilai: totalOnline });
  sheetSummary.addRow({ keterangan: "Transaksi Kasir (On-Shop)", nilai: totalOnShop });
  sheetSummary.addRow({ keterangan: "Transaksi Dibatalkan", nilai: totalDibatalkan });
  sheetSummary.getCell("B4").numFmt = '"Rp"#,##0';

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    success: true,
    base64: Buffer.from(buffer).toString("base64"),
    fileName: `Laporan_SIR_${label.replace(/\s+/g, "_")}.xlsx`,
  };
}

export async function generateLaporanPdf(periodeMulai: string, periodeSelesai: string, label: string) {
  const rawData = await fetchRawData(periodeMulai, periodeSelesai);

  const dataValid = rawData.filter((r) => r.status_pesanan !== "dibatalkan");
  const totalTransaksi = new Set(dataValid.map((r) => r.id_pesanan)).size;
  const totalPendapatan = dataValid.reduce((sum, r) => sum + Number(r.subtotal), 0);

  const menuMap = new Map<string, { jumlah: number; total: number }>();
  for (const row of dataValid) {
    const existing = menuMap.get(row.nama_menu) ?? { jumlah: 0, total: 0 };
    existing.jumlah += row.jumlah;
    existing.total += Number(row.subtotal);
    menuMap.set(row.nama_menu, existing);
  }
  const menuTerlaris = Array.from(menuMap.entries())
    .sort((a, b) => b[1].jumlah - a[1].jumlah)
    .slice(0, 10)
    .map(([nama_menu, v]) => ({ namaMenu: nama_menu, jumlah: v.jumlah, total: v.total }));

  const transaksiList = Array.from(new Set(dataValid.map((r) => r.id_pesanan))).map((idPesanan) => {
    const items = dataValid.filter((r) => r.id_pesanan === idPesanan);
    const first = items[0];
    return {
      id: idPesanan,
      tanggal: new Date(first.waktu_pesan).toLocaleString("id-ID"),
      meja: first.nomor_meja ?? "Take Away",
      sumber: SUMBER_LABEL[first.sumber_pesanan] ?? first.sumber_pesanan,
      status: STATUS_LABEL[first.status_pesanan] ?? first.status_pesanan,
      total: items.reduce((sum, i) => sum + Number(i.subtotal), 0),
    };
  });

  const buffer = await renderToBuffer(
    <LaporanPdfDocument
      label={label}
      totalTransaksi={totalTransaksi}
      totalPendapatan={totalPendapatan}
      menuTerlaris={menuTerlaris}
      transaksi={transaksiList}
    />
  );

  return {
    success: true,
    base64: buffer.toString("base64"),
    fileName: `Laporan_SIR_${label.replace(/\s+/g, "_")}.pdf`,
  };
}