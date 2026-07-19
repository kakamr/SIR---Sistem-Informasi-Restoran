"use client";

import type { Meja } from "@/lib/types";

interface MejaCardProps {
  meja: Meja;
  onKosongkan: () => void;
}

export default function MejaCard({
  meja,
  onKosongkan,
}: MejaCardProps) {
  const isTerisi = meja.statusMeja === "terisi";

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-6 flex flex-col shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <span className="font-bold text-lg">
          Meja
        </span>

        <span
          className={`text-sm font-semibold px-3 py-1 rounded-full ${
            isTerisi
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {isTerisi ? "Terisi" : "Kosong"}
        </span>
      </div>

      {/* Nomor Meja */}
      <div className="flex justify-center mb-5">
        <div className="w-28 h-28 rounded-full bg-[#2d5a4a] text-white flex items-center justify-center text-5xl font-bold">
          {meja.nomorMeja.replace(/\D/g, "")}
        </div>
      </div>

      {/* Informasi */}
      <div className="space-y-2 text-sm mb-6">

        <div className="flex justify-between">
          <span className="text-black/60">
            Nomor
          </span>

          <span className="font-semibold">
            {meja.nomorMeja}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-black/60">
            Kapasitas
          </span>

          <span className="font-semibold">
            {meja.kapasitas} Orang
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-black/60">
            QR
          </span>

          <span className="font-semibold truncate max-w-[120px] text-right">
            {meja.qrCode ?? "-"}
          </span>
        </div>

      </div>

      <div className="mt-auto">
        <button
          disabled={!isTerisi}
          onClick={onKosongkan}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            isTerisi
              ? "bg-[#2d5a4a] text-white hover:bg-[#25493d]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isTerisi ? "Kosongkan" : "Sudah Kosong"}
        </button>
      </div>
    </div>
  );
}