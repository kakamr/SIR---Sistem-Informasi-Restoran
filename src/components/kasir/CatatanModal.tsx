"use client";

import { useEffect, useState } from "react";

interface CatatanModalProps {
  isOpen: boolean;
  namaMenu: string;
  catatanAwal?: string;
  onClose: () => void;
  onSave: (catatan: string) => void;
}

export default function CatatanModal({
  isOpen,
  namaMenu,
  catatanAwal = "",
  onClose,
  onSave,
}: CatatanModalProps) {
  const [catatan, setCatatan] = useState(catatanAwal);

  useEffect(() => {
    if (isOpen) setCatatan(catatanAwal);
  }, [isOpen, catatanAwal]);

  if (!isOpen) return null;

  function handleBatal() {
    setCatatan(catatanAwal);
    onClose();
  }

  function handleTutup() {
    onSave(catatan.trim());
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleBatal}
    >
      <div
        className="bg-[#fdf8f0] rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-1">Catatan</h2>
        <p className="text-black/50 text-sm mb-6">{namaMenu}</p>

        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Tambah Catatan"
          rows={4}
          className="w-full bg-[#fdf8f0] rounded-lg p-4 min-h-[120px] border border-[#e2e2e2] text-sm leading-relaxed resize-none focus:outline-none focus:border-[#2d5a4a]"
        />

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleBatal}
            className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            onClick={handleTutup}
            className="flex-1 py-3 rounded-lg bg-[#2d5a4a] hover:bg-[#254a3d] text-[#fdf8f0] font-semibold transition"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}