"use client";

import { useState } from "react";
import Image from "next/image";
import { generateLaporanExcel, generateLaporanPdf } from "@/lib/actions/export-laporan";
import PeriodeLaporanModal, { type PeriodeTerpilih } from "@/components/shared/PeriodeLaporanModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<"pdf" | "excel" | null>(null);

  async function handleGenerate(periode: PeriodeTerpilih, format: "pdf" | "excel") {
    setIsGenerating(format);

    try {
      if (format === "excel") {
        const result = await generateLaporanExcel(periode.periodeMulai, periode.periodeSelesai, periode.label);
        if (result.success) {
          downloadBase64File(
            result.base64,
            result.fileName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        }
      } else {
        const result = await generateLaporanPdf(periode.periodeMulai, periode.periodeSelesai, periode.label);
        if (result.success) {
          downloadBase64File(result.base64, result.fileName, "application/pdf");
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
    }

    setIsGenerating(null);
  }

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-6">
      <h3 className="font-bold text-lg mb-4">Generate Laporan</h3>
      <div className="flex flex-col items-center gap-3">
        <Image src="/icons/laporan/pdf.png" alt="laporan" width={70} height={70} />
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg text-sm"
        >
          Atur Periode
        </button>
      </div>

      <PeriodeLaporanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        isGenerating={isGenerating}
      />
    </div>
  );
}