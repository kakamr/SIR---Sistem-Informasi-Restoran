// src/app/(koki)/stok/StokClient.tsx
"use client";

import { useState, useEffect } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import BahanStokCard from "@/components/koki/BahanStokCard";
import BahanFormModal from "@/components/koki/BahanFormModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import { createBahan, updateBahan, deleteBahan, getBahanList } from "@/lib/actions/bahan";
import type { BahanBaku } from "@/lib/types";

export default function StokClient({ initialBahanList }: { initialBahanList: BahanBaku[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState<BahanBaku | undefined>(undefined);
  const [bahanToDelete, setBahanToDelete] = useState<BahanBaku | null>(null);
  const [error, setError] = useState("");

  // Polling dijeda selama ada modal terbuka supaya daftarnya tidak berubah
  // di bawah tangan koki saat sedang mengisi form atau konfirmasi hapus
  const { data } = usePolling(getBahanList, 3000, !isModalOpen && bahanToDelete === null);
  const bahanList = data ?? initialBahanList;

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  function handleOpenCreate() {
    setEditingBahan(undefined);
    setIsModalOpen(true);
  }

  function handleOpenEdit(bahan: BahanBaku) {
    setEditingBahan(bahan);
    setIsModalOpen(true);
  }

  async function handleSubmitBahan(data: Omit<BahanBaku, "idBahan" | "statusStok">) {
    setError("");
    // Hasilnya dikembalikan ke modal — modal yang menampilkan errornya inline
    if (editingBahan) {
      return await updateBahan(editingBahan.idBahan, data);
    }
    return await createBahan(data);
  }

  async function handleConfirmDelete() {
    if (!bahanToDelete) return;

    const result = await deleteBahan(bahanToDelete.idBahan);
    setBahanToDelete(null);

    if (!result.success) {
      setError(result.message ?? "Gagal menghapus bahan");
    }
    // Daftar otomatis diperbarui lewat polling berikutnya
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold px-2" aria-label="Tutup">
            ×
          </button>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          onClick={handleOpenCreate}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg"
        >
          Tambah Bahan
        </button>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {bahanList.map((bahan) => (
          <BahanStokCard
            key={bahan.idBahan}
            bahan={bahan}
            onEdit={() => handleOpenEdit(bahan)}
            onDelete={() => setBahanToDelete(bahan)}
          />
        ))}
      </div>

      {bahanList.length === 0 && (
        <p className="text-center text-black/40 mt-12">Belum ada bahan baku</p>
      )}

      <BahanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={editingBahan ? "edit" : "create"}
        initialData={editingBahan}
        onSubmit={handleSubmitBahan}
      />

      <ConfirmDeleteModal
        isOpen={bahanToDelete !== null}
        title="Hapus Bahan"
        description={
          bahanToDelete
            ? `Apakah Anda yakin ingin menghapus "${bahanToDelete.namaBahan}"?`
            : ""
        }
        warningText="Bahan yang masih dipakai di resep menu tidak bisa dihapus."
        confirmLabel="Hapus"
        onClose={() => setBahanToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}