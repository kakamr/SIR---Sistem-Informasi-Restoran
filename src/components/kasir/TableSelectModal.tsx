"use client";

import type { Meja } from "@/lib/types";

interface TableSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  meja: Meja[];
  selectedMejaId: number | null;
  onSelect: (idMeja: number) => void;
}

export default function TableSelectModal({
  isOpen,
  onClose,
  meja,
  selectedMejaId,
  onSelect,
}: TableSelectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Pilih Meja</h2>

        <div className="grid grid-cols-6 gap-3">
          {meja.map((m) => {
            const isSelected = m.idMeja === selectedMejaId;
            const isTerisi = m.statusMeja === "terisi" && !isSelected;

            return (
              <button
                key={m.idMeja}
                disabled={isTerisi}
                onClick={() => {
                  onSelect(m.idMeja);
                  onClose();
                }}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-colors ${
                  isSelected
                    ? "bg-[#2d5a4a] text-white"
                    : isTerisi
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {m.nomorMeja.replace(/\D/g, "")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}