"use client";

import { useState, useTransition } from "react";
import { generateKodeAksesMeja } from "@/lib/actions/qr";
import Image from "next/image";

interface QrMejaItem {
  idMeja: number;
  nomorMeja: string;
  orderUrl: string | null;
  qrDataUrl: string | null;
}

export default function QrMejaClient({ qrList }: { qrList: QrMejaItem[] }) {
  const [isPending, startTransition] = useTransition();
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  function handleGenerate(idMeja: number) {
    setGeneratingId(idMeja);
    startTransition(async () => {
      const result = await generateKodeAksesMeja(idMeja);
      if (!result.success) alert(result.message);
      setGeneratingId(null);
      window.location.reload(); // refresh supaya QR baru langsung kelihatan
    });
  }

  function handlePrint() {
      window.open(
        "/qr-print",
        "_blank",
        "width=900,height=900"
      );
  }

  const mejaBelumAdaQr = qrList.filter((m) => !m.qrDataUrl);
  const mejaSudahAdaQr = qrList.filter((m) => m.qrDataUrl);

  return (
    <div className="min-h-screen bg-[#e2e2e2] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-black/60 text-sm">
            Cetak halaman ini, potong per kartu, lalu tempel di meja masing-masing.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg"
        >
          Cetak / Print
        </button>
      </div>

      {mejaBelumAdaQr.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-6 print:hidden">
          <h2 className="font-bold mb-3">Meja Belum Punya QR ({mejaBelumAdaQr.length})</h2>
          <div className="flex flex-wrap gap-3">
            {mejaBelumAdaQr.map((meja) => (
              <button
                key={meja.idMeja}
                onClick={() => handleGenerate(meja.idMeja)}
                disabled={isPending && generatingId === meja.idMeja}
                className="bg-[#2d5a4a] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {isPending && generatingId === meja.idMeja
                  ? "Memproses..."
                  : `Generate QR - ${meja.nomorMeja}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
        {mejaSudahAdaQr.map((item) => (
          <div
            key={item.idMeja}
            className="bg-white rounded-xl p-6 flex flex-col items-center border border-black/10 print:border-black print:break-inside-avoid"
          >
            <p className="text-sm text-black/50 mb-1">SIR - Scan untuk memesan</p>
            <h2 className="text-3xl font-bold mb-4">{item.nomorMeja}</h2>
            <Image src={item.qrDataUrl!} alt={`QR Meja ${item.nomorMeja}`} width={200} height={200} />
            <p className="text-xs text-black/40 mt-4 break-all text-center">{item.orderUrl}</p>
          </div>
        ))}
      </div>

      {qrList.length === 0 && (
        <p className="text-center text-black/40 mt-12">Belum ada meja. Tambahkan meja terlebih dahulu.</p>
      )}
    </div>
  );
}