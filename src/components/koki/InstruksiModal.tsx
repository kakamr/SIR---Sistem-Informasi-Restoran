"use client";

interface InstruksiModalProps {
  isOpen: boolean;
  namaMenu: string;
  instruksiMasak?: string;
  onClose: () => void;
}

export default function InstruksiModal({
  isOpen,
  namaMenu,
  instruksiMasak,
  onClose,
}: InstruksiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-1">Resep / Instruksi</h2>
        <p className="text-black/50 text-sm mb-6">{namaMenu}</p>

        <div className="bg-[#fdf8f0] rounded-lg p-4 min-h-[120px] whitespace-pre-wrap text-sm leading-relaxed">
          {instruksiMasak && instruksiMasak.trim().length > 0
            ? instruksiMasak
            : "Belum ada instruksi untuk menu ini."}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3 mt-6"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}