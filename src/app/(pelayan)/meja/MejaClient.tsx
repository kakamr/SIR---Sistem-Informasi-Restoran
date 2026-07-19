"use client";

import { useState } from "react";
import type { Meja } from "@/lib/types";
import { updateStatusMeja, getMejaList } from "@/lib/actions/meja";
import { usePolling } from "@/lib/hooks/usePolling";
import MejaCard from "@/components/pelayan/MejaCard";
import EmptyTableModal from "@/components/pelayan/EmptyTableModal";

interface MejaClientProps {
  initialMeja: Meja[];
}

export default function MejaClient({ initialMeja }: MejaClientProps) {
  const { data: polledMeja } = usePolling(getMejaList, 3000);
  const mejaList = polledMeja ?? initialMeja;

  const [selectedMeja, setSelectedMeja] = useState<Meja | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleOpenModal(meja: Meja) {
    setSelectedMeja(meja);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setSelectedMeja(null);
    setIsModalOpen(false);
  }

  async function handleKosongkan() {
    if (!selectedMeja) return;

    handleCloseModal();

    const result = await updateStatusMeja(selectedMeja.idMeja, "kosong");

    if (!result.success) {
      alert(result.message);
    }
    // Tidak perlu setState manual lagi - polling ambil alih dalam 3 detik
  }

  return (
    <>
      <main className="flex-1 p-8 overflow-y-auto">
        {mejaList.length === 0 ? (
          <p className="text-center text-black/40 mt-20">Belum ada meja.</p>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {mejaList.map((meja) => (
              <MejaCard key={meja.idMeja} meja={meja} onKosongkan={() => handleOpenModal(meja)} />
            ))}
          </div>
        )}
      </main>

      <EmptyTableModal
        isOpen={isModalOpen}
        meja={selectedMeja}
        onClose={handleCloseModal}
        onConfirm={handleKosongkan}
      />
    </>
  );
}