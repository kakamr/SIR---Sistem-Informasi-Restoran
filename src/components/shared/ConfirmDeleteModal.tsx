"use client";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningText?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  warningText,
  confirmLabel = "Hapus",
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-[#fdf8f0] rounded-2xl w-[420px] p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-3">{title}</h2>

        <p className="text-center text-black/70 leading-7">{description}</p>

        {warningText && (
          <p className="text-center text-sm text-black/50 mt-4">{warningText}</p>
        )}

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-gray-300 font-semibold hover:bg-gray-100 transition"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}