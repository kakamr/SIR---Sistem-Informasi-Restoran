"use client";

import type { Meja } from "@/lib/types";

interface EmptyTableModalProps {
  isOpen: boolean;
  meja: Meja | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EmptyTableModal({
  isOpen,
  meja,
  onClose,
  onConfirm,
}: EmptyTableModalProps) {
  if (!isOpen || !meja) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-[#fdf8f0] rounded-2xl w-[420px] p-8 shadow-xl">

        {/* Judul */}
        <h2 className="text-2xl font-bold text-center mb-3">
          Kosongkan Meja
        </h2>

        {/* Isi */}
        <p className="text-center text-black/70 leading-7">
          Apakah Anda yakin ingin mengubah
          <br />
          <span className="font-bold">
            {meja.nomorMeja}
          </span>
          <br />
          menjadi status <b>Kosong</b>?
        </p>

        <p className="text-center text-sm text-black/50 mt-4">
          Pastikan pelanggan telah meninggalkan meja
          sebelum mengubah status.
        </p>

        {/* Tombol */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-100 transition"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-[#2d5a4a] text-white font-semibold hover:bg-[#25493d] transition"
          >
            Kosongkan
          </button>
        </div>
      </div>
    </div>
  );
}