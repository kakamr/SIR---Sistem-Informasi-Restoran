"use client";

import { useState } from "react";

interface MejaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { nomorMeja: string; kapasitas: number }) => void;
}

export default function MejaFormModal({ isOpen, onClose, onSubmit }: MejaFormModalProps) {
  const [nomorMeja, setNomorMeja] = useState("");
  const [kapasitas, setKapasitas] = useState(4);

  if (!isOpen) return null;

  function handleSubmit() {
    if (!nomorMeja.trim() || kapasitas <= 0) {
      alert("Nomor meja dan kapasitas wajib diisi");
      return;
    }
    onSubmit({ nomorMeja, kapasitas });
    setNomorMeja("");
    setKapasitas(4);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">Tambah Meja</h2>

        <label className="block text-sm font-semibold mb-2">Nomor Meja</label>
        <input
          type="text"
          value={nomorMeja}
          onChange={(e) => setNomorMeja(e.target.value)}
          placeholder="Contoh: M-05"
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        />

        <label className="block text-sm font-semibold mb-2">Kapasitas</label>
        <input
          type="number"
          value={kapasitas}
          onChange={(e) => setKapasitas(Number(e.target.value))}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-6 outline-none"
        />

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