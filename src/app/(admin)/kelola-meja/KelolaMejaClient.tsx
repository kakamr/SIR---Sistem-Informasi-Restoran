"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import { getMejaList, createMeja, deleteMeja } from "@/lib/actions/meja";
import MejaFormModal from "@/components/admin/MejaFormModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import type { Meja } from "@/lib/types";

export default function KelolaMejaClient({ initialMeja }: { initialMeja: Meja[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mejaToDelete, setMejaToDelete] = useState<Meja | null>(null);

  const { data } = usePolling(getMejaList, 5000, !isModalOpen && !mejaToDelete);
  const mejaList = data ?? initialMeja;

  async function handleCreate(data: { nomorMeja: string; kapasitas: number }) {
    const result = await createMeja(data);
    if (!result.success) alert(result.message);
  }

  async function handleConfirmDelete() {
    if (!mejaToDelete) return;

    const result = await deleteMeja(mejaToDelete.idMeja);
    if (!result.success) {
      alert(result.message);
    }
    setMejaToDelete(null);
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg"
        >
          Tambah Meja
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {mejaList.map((meja) => {
          const isTerisi = meja.statusMeja === "terisi";

          return (
            <div key={meja.idMeja} className="bg-[#fdf8f0] rounded-xl p-6 flex flex-col shadow-sm">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <span className="font-bold text-lg">Meja</span>
                <span
                  className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    isTerisi ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {isTerisi ? "Terisi" : "Kosong"}
                </span>
              </div>

              {/* Nomor Meja */}
              <div className="flex justify-center mb-5">
                <div className="w-28 h-28 rounded-full bg-[#2d5a4a] text-white flex items-center justify-center text-5xl font-bold">
                  {meja.nomorMeja.replace(/\D/g, "")}
                </div>
              </div>

              {/* Informasi */}
              <div className="space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-black/60">Nomor</span>
                  <span className="font-semibold">{meja.nomorMeja}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Kapasitas</span>
                  <span className="font-semibold">{meja.kapasitas} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">QR</span>
                  <span className="font-semibold truncate max-w-[120px] text-right">
                    {meja.qrCode ?? "-"}
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <button
                  onClick={() => setMejaToDelete(meja)}
                  className="w-full py-3 rounded-lg border border-red-500 text-red-500 font-semibold hover:bg-red-50 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {mejaList.length === 0 && (
        <p className="text-center text-black/40 mt-20">Belum ada meja.</p>
      )}

      <MejaFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />

      <ConfirmDeleteModal
        isOpen={mejaToDelete !== null}
        title="Hapus Meja"
        description={mejaToDelete ? `Apakah Anda yakin ingin menghapus "${mejaToDelete.nomorMeja}"?` : ""}
        warningText="Meja yang masih memiliki pesanan aktif tidak bisa dihapus."
        onClose={() => setMejaToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}