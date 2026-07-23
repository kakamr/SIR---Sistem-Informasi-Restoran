"use client";

import { useState } from "react";
import type { BahanBaku } from "@/lib/types";

interface QuantityUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBahan: BahanBaku[]; // daftar bahan master untuk dipilih
  onSubmit: (idBahan: number, namaBahan: string, jumlah: number, satuan: string) => void;
}

export default function QuantityUnitModal({
  isOpen,
  onClose,
  availableBahan,
  onSubmit,
}: QuantityUnitModalProps) {
  const [selectedBahanId, setSelectedBahanId] = useState<number | "">("");
  const [jumlah, setJumlah] = useState(0);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const selectedBahan = availableBahan.find((b) => b.idBahan === selectedBahanId);

  function handleSubmit() {
    setError("");

    if (!selectedBahan || jumlah <= 0) {
      setError("Pilih bahan dan masukkan jumlah yang valid");
      return;
    }
    onSubmit(selectedBahan.idBahan, selectedBahan.namaBahan, jumlah, selectedBahan.satuan);
    setSelectedBahanId("");
    setJumlah(0);
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold mb-2">Pilih Bahan</label>
        <select
          value={selectedBahanId}
          onChange={(e) => setSelectedBahanId(Number(e.target.value))}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        >
          <option value="">-- Pilih Bahan --</option>
          {availableBahan.map((b) => (
            <option key={b.idBahan} value={b.idBahan}>
              {b.namaBahan}
            </option>
          ))}
        </select>

        <label className="block text-sm font-semibold mb-2">Kuantitas/Berat</label>
        <div className="flex border border-black/20 rounded-lg overflow-hidden mb-6">
          <input
            type="number"
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value))}
            className="flex-1 px-4 py-3 outline-none"
            min={0}
          />
          <span className="px-4 py-3 bg-gray-100 text-black/60 flex items-center">
            {selectedBahan?.satuan ?? "-"}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}