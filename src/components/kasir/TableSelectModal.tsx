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
                onClick={() => {
                  onSelect(m.idMeja);
                  onClose();
                }}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-colors relative ${
                  isSelected
                    ? "bg-[#2d5a4a] text-white"
                    : isTerisi
                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-2 border-yellow-400"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {m.nomorMeja.replace(/\D/g, "")}
                {isTerisi && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}