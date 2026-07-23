"use client";

import { useState } from "react";

export type JenisPeriode = "harian" | "bulanan" | "tahunan";

export interface PeriodeTerpilih {
  jenisPeriode: JenisPeriode;
  periodeMulai: string; // YYYY-MM-DD
  periodeSelesai: string; // YYYY-MM-DD
  label: string; // untuk ditampilkan di nama file / judul laporan
}

interface PeriodeLaporanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (periode: PeriodeTerpilih, format: "pdf" | "excel") => void;
  isGenerating: "pdf" | "excel" | null;
}

const BULAN_LIST = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function PeriodeLaporanModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: PeriodeLaporanModalProps) {
  const today = new Date();

  const [jenisPeriode, setJenisPeriode] = useState<JenisPeriode>("harian");
  const [tanggalHarian, setTanggalHarian] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  );
  const [bulanTerpilih, setBulanTerpilih] = useState(today.getMonth());
  const [tahunBulanan, setTahunBulanan] = useState(today.getFullYear());
  const [tahunTerpilih, setTahunTerpilih] = useState(today.getFullYear());
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function hitungPeriode(): PeriodeTerpilih {
    if (jenisPeriode === "harian") {
      return {
        jenisPeriode: "harian",
        periodeMulai: tanggalHarian,
        periodeSelesai: tanggalHarian,
        label: new Date(tanggalHarian).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
      };
    }

    if (jenisPeriode === "bulanan") {
      const mulai = `${tahunBulanan}-${pad(bulanTerpilih + 1)}-01`;
      const selesai = `${tahunBulanan}-${pad(bulanTerpilih + 1)}-${pad(
        lastDayOfMonth(tahunBulanan, bulanTerpilih)
      )}`;
      return {
        jenisPeriode: "bulanan",
        periodeMulai: mulai,
        periodeSelesai: selesai,
        label: `${BULAN_LIST[bulanTerpilih]} ${tahunBulanan}`,
      };
    }

    // tahunan
    const mulai = `${tahunTerpilih}-01-01`;
    const selesai = `${tahunTerpilih}-12-31`;
    return {
      jenisPeriode: "tahunan",
      periodeMulai: mulai,
      periodeSelesai: selesai,
      label: `Tahun ${tahunTerpilih}`,
    };
  }

  function handleGenerate(format: "pdf" | "excel") {
    setError("");

    if (jenisPeriode === "harian" && !tanggalHarian) {
      setError("Pilih tanggal terlebih dahulu");
      return;
    }

    onGenerate(hitungPeriode(), format);
  }

  const tahunOptions = Array.from({ length: 6 }, (_, i) => today.getFullYear() - i);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Atur Periode Laporan</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold mb-2">Jenis Periode</label>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(["harian", "bulanan", "tahunan"] as JenisPeriode[]).map((j) => (
            <button
              key={j}
              onClick={() => setJenisPeriode(j)}
              className={`py-2.5 rounded-lg text-sm font-semibold capitalize transition-colors ${
                jenisPeriode === j
                  ? "bg-[#2d5a4a] text-white"
                  : "bg-gray-100 text-black/60 hover:bg-gray-200"
              }`}
            >
              {j}
            </button>
          ))}
        </div>

        {jenisPeriode === "harian" && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Pilih Tanggal</label>
            <input
              type="date"
              value={tanggalHarian}
              onChange={(e) => setTanggalHarian(e.target.value)}
              max={`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`}
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
            />
          </div>
        )}

        {jenisPeriode === "bulanan" && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-2">Bulan</label>
              <select
                value={bulanTerpilih}
                onChange={(e) => setBulanTerpilih(Number(e.target.value))}
                className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
              >
                {BULAN_LIST.map((b, i) => (
                  <option key={b} value={i}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Tahun</label>
              <select
                value={tahunBulanan}
                onChange={(e) => setTahunBulanan(Number(e.target.value))}
                className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
              >
                {tahunOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {jenisPeriode === "tahunan" && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Pilih Tahun</label>
            <select
              value={tahunTerpilih}
              onChange={(e) => setTahunTerpilih(Number(e.target.value))}
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
            >
              {tahunOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleGenerate("pdf")}
            disabled={isGenerating !== null}
            className="flex-1 bg-[#2d5a4a] text-white font-semibold rounded-lg py-3 disabled:opacity-50"
          >
            {isGenerating === "pdf" ? "Memproses..." : "Download PDF"}
          </button>
          <button
            onClick={() => handleGenerate("excel")}
            disabled={isGenerating !== null}
            className="flex-1 bg-[#2d5a4a] text-white font-semibold rounded-lg py-3 disabled:opacity-50"
          >
            {isGenerating === "excel" ? "Memproses..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}