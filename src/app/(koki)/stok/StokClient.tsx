// src/app/(koki)/stok/StokClient.tsx
"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import BahanStokCard from "@/components/koki/BahanStokCard";
import BahanFormModal from "@/components/koki/BahanFormModal";
import { createBahan, updateBahan, deleteBahan, getBahanList } from "@/lib/actions/bahan";
import type { BahanBaku } from "@/lib/types";

export default function StokClient({ initialBahanList }: { initialBahanList: BahanBaku[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBahan, setEditingBahan] = useState<BahanBaku | undefined>(undefined);

  const { data } = usePolling(getBahanList, 3000, !isModalOpen);
  const bahanList = data ?? initialBahanList;

  function handleOpenCreate() {
    setEditingBahan(undefined);
    setIsModalOpen(true);
  }

  function handleOpenEdit(bahan: BahanBaku) {
    setEditingBahan(bahan);
    setIsModalOpen(true);
  }

  async function handleSubmitBahan(data: Omit<BahanBaku, "idBahan" | "statusStok">) {
    if (editingBahan) {
      const result = await updateBahan(editingBahan.idBahan, data);
      if (!result.success) alert(result.message);
    } else {
      const result = await createBahan(data);
      if (!result.success) alert(result.message);
    }
  }

  async function handleDelete(idBahan: number) {
    if (!confirm("Yakin ingin menghapus bahan ini?")) return;
    const result = await deleteBahan(idBahan);
    if (!result.success) alert(result.message);
    // List otomatis update lewat polling berikutnya
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
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
            onDelete={() => handleDelete(bahan.idBahan)}
          />
        ))}
      </div>

      <BahanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={editingBahan ? "edit" : "create"}
        initialData={editingBahan}
        onSubmit={handleSubmitBahan}
      />
    </main>
  );
}