"use client";

import { useState } from "react";
import { generateLaporanExcel, generateLaporanPdf } from "@/lib/actions/export-laporan";
import Image from "next/image";

function downloadBase64File(base64: string, fileName: string, mimeType: string) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanActionsClient() {
  const [isGenerating, setIsGenerating] = useState<"pdf" | "excel" | null>(null);

  async function handleGenerate(type: "pdf" | "excel") {
    setIsGenerating(type);

    // Contoh: laporan bulan berjalan. Bisa diganti jadi date range picker kalau perlu.
    const now = new Date();
    const periodeMulai = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodeSelesai = now.toISOString().slice(0, 10);

    try {
      if (type === "excel") {
        const result = await generateLaporanExcel(periodeMulai, periodeSelesai);
        if (result.success) {
          downloadBase64File(
            result.base64,
            result.fileName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        }
      } else {
        const result = await generateLaporanPdf(periodeMulai, periodeSelesai);
        if (result.success) {
          downloadBase64File(result.base64, result.fileName, "application/pdf");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Gagal generate laporan");
    }

    setIsGenerating(null);
  }

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-6">
      <h3 className="font-bold text-lg mb-4">Generate Laporan</h3>
      <div className="flex gap-4 items-center">
        <button
          onClick={() => handleGenerate("pdf")}
          disabled={isGenerating !== null}
          className="flex-1 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <Image src="/icons/laporan/pdf.png" alt="export pdf" width={70} height={70}/>
          <span className="text-sm font-semibold underline">
            {isGenerating === "pdf" ? "Memproses..." : "Download PDF"}
          </span>
        </button>
        <div className="w-px h-16 bg-black/10" />
        <button
          onClick={() => handleGenerate("excel")}
          disabled={isGenerating !== null}
          className="flex-1 flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <Image src="/icons/laporan/excel.png" alt="export excel" width={70} height={70}/>
          <span className="text-sm font-semibold underline">
            {isGenerating === "excel" ? "Memproses..." : "Download Excel"}
          </span>
        </button>
      </div>
    </div>
  );
}