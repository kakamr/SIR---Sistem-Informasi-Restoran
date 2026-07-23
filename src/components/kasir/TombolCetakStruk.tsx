"use client";

import { useState } from "react";
import { getStrukKasir } from "@/lib/actions/pesanan";
import type { StrukKasirData } from "@/lib/types";

// Ganti di sini kalau data restoran berubah
const NAMA_RESTORAN = "SIR";
const ALAMAT_RESTORAN = "House of Daena, Sumeru Akademiya, Hutan Avidya, Teyvat";
const TELEPON_RESTORAN = "0833550336";

const METODE_LABEL: Record<string, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  edc: "Debit / EDC",
  gopay: "Gopay",
  dana: "Dana",
  bri_va: "BRI Virtual Account",
  bca_va: "BCA Virtual Account",
  bni_va: "BNI Virtual Account",
};

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

function rupiah(nilai: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(nilai);
}

function tanggalJam(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buatHtmlStruk(data: StrukKasirData): string {
  const isTakeAway = data.jenisLayanan === "take_away";

  const barisItem = data.items
    .map(
      (item) => `
        <div class="item">
          <div>${escapeHtml(item.namaMenu)}</div>
          <div class="baris">
            <span>${item.jumlah} x ${rupiah(item.hargaSatuan)}</span>
            <span>${rupiah(item.subtotal)}</span>
          </div>
          ${
            item.catatanItem
              ? `<div class="catatan">Catatan: ${escapeHtml(item.catatanItem)}</div>`
              : ""
          }
        </div>`
    )
    .join("");

  const blokAntrian =
    isTakeAway && data.nomorAntrian
      ? `<div class="antrian">
           <div class="kecil">NOMOR ANTRIAN</div>
           <div class="antrian-nomor">${escapeHtml(data.nomorAntrian)}</div>
         </div>`
      : "";

  const barisMeja =
    !isTakeAway && data.nomorMeja
      ? `<div class="baris"><span>Meja</span><span>${escapeHtml(data.nomorMeja)}</span></div>`
      : "";

  const barisKasir = data.namaKasir
    ? `<div class="baris"><span>Kasir</span><span>${escapeHtml(data.namaKasir)}</span></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Struk-${String(data.idPesanan).padStart(6, "0")}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    width: 80mm;
    margin: 0;
    padding: 4mm 4mm 10mm;
    background: #fff;
    color: #000;
    font-family: "Courier New", Courier, monospace;
    font-size: 11px;
    line-height: 1.45;
  }
  .center { text-align: center; }
  .nama { font-size: 20px; font-weight: bold; letter-spacing: 3px; }
  .kecil { font-size: 10px; }
  .garis { border-top: 1px dashed #000; margin: 6px 0; }
  .baris { display: flex; justify-content: space-between; gap: 8px; }
  .total { font-size: 13px; font-weight: bold; margin-top: 2px; }
  .catatan { font-size: 10px; font-style: italic; padding-left: 10px; }
  .antrian { text-align: center; border: 1px solid #000; padding: 4px; margin: 7px 0; }
  .antrian-nomor { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
  .item { margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="center">
    <div class="nama">${NAMA_RESTORAN}</div>
    <div class="kecil">${ALAMAT_RESTORAN}</div>
    <div class="kecil">Telp. ${TELEPON_RESTORAN}</div>
  </div>

  <div class="garis"></div>

  <div class="baris"><span>No. Pesanan</span><span>#${String(data.idPesanan).padStart(6, "0")}</span></div>
  <div class="baris"><span>Tanggal</span><span>${tanggalJam(data.waktuPesan)}</span></div>
  ${barisKasir}
  <div class="baris"><span>Layanan</span><span>${isTakeAway ? "Take Away" : "Dine In"}</span></div>
  ${barisMeja}
  ${blokAntrian}

  <div class="garis"></div>
  ${barisItem}
  <div class="garis"></div>

  <div class="baris"><span>Subtotal</span><span>${rupiah(data.subtotal)}</span></div>
  <div class="baris"><span>Pajak</span><span>${rupiah(data.pajak)}</span></div>
  <div class="baris total"><span>TOTAL</span><span>${rupiah(data.total)}</span></div>
  <div class="baris" style="margin-top:4px">
    <span>Metode Bayar</span>
    <span>${escapeHtml(METODE_LABEL[data.metodePembayaran] ?? data.metodePembayaran)}</span>
  </div>

  <div class="garis"></div>

  <div class="center kecil">
    Terima kasih atas kunjungan Anda<br />
    Simpan struk ini sebagai bukti pembayaran
  </div>
</body>
</html>`;
}

async function cetakLewatIframe(html: string) {
  // Bersihkan iframe sisa cetakan sebelumnya
  document.getElementById("iframe-struk")?.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "iframe-struk";
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;"
  );
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) return;

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Beri waktu iframe merender isinya sebelum dialog cetak dibuka
  await new Promise((resolve) => setTimeout(resolve, 250));

  win.addEventListener("afterprint", () => {
    setTimeout(() => iframe.remove(), 200);
  });
  // Jaring pengaman kalau afterprint tidak pernah terpanggil
  setTimeout(() => iframe.remove(), 60000);

  win.focus();
  win.print();
}

interface TombolCetakStrukProps {
  idPesanan: number;
  label?: string;
  className?: string;
}

export default function TombolCetakStruk({
  idPesanan,
  label = "Cetak Struk",
  className,
}: TombolCetakStrukProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCetak() {
    setError("");
    setIsLoading(true);
    const data = await getStrukKasir(idPesanan);
    setIsLoading(false);

    if (!data) {
      setError("Data struk tidak ditemukan");
      return;
    }

    await cetakLewatIframe(buatHtmlStruk(data));
  }

  return (
    <>
      <button
        onClick={handleCetak}
        disabled={isLoading}
        className={
          className ??
          "w-full border-2 border-[#2d5a4a] text-[#2d5a4a] font-semibold rounded-lg py-3 disabled:opacity-50"
        }
      >
        {isLoading ? "Menyiapkan..." : label}
      </button>

      {error && <p className="text-xs text-red-600 mt-1 text-center">{error}</p>}
    </>
  );
}