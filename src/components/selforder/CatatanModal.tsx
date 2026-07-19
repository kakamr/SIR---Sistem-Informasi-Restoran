"use client";

import { useState, useEffect } from "react";

interface CatatanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue: string;
  onSave: (catatan: string) => void;
}

export default function CatatanModal({ isOpen, onClose, initialValue, onSave }: CatatanModalProps) {
  const [catatan, setCatatan] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setCatatan(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#fdf8f0] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Catatan Pesanan</h2>
          <button onClick={onClose} className="text-2xl leading-none" aria-label="Tutup">
            ×
          </button>
        </div>

        <textarea
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Masukan Catatan"
          rows={8}
          className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 outline-none resize-none mb-4"
        />

        <button
          onClick={() => {
            onSave(catatan);
            onClose();
          }}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4"
        >
          Simpan Catatan
        </button>
      </div>
    </div>
  );
}