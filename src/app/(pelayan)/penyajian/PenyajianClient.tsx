"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import OrderCard from "@/components/shared/OrderCard";
import { updateStatusPesanan, getPesananSiapSaji } from "@/lib/actions/pesanan"; // ganti fungsi polling
import type { Pesanan } from "@/lib/types";

export default function PenyajianClient({ initialPesanan }: { initialPesanan: Pesanan[] }) {
  const { data } = usePolling(getPesananSiapSaji, 3000); // langsung pakai fungsi baru, tanpa filter tambahan lagi

  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set());
  const pesananSiapSaji = (data ?? initialPesanan).filter((p) => !justCompleted.has(p.idPesanan));

  async function handleSelesaiDisajikan(idPesanan: number) {
    setJustCompleted((prev) => new Set(prev).add(idPesanan));

    const result = await updateStatusPesanan(idPesanan, "selesai");
    if (!result.success) {
      alert("Gagal update status, silakan coba lagi");
      setJustCompleted((prev) => {
        const next = new Set(prev);
        next.delete(idPesanan);
        return next;
      });
    }
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {pesananSiapSaji.length === 0 ? (
        <p className="text-center text-black/40 mt-16 text-lg">Kosong</p>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {pesananSiapSaji.map((pesanan) => (
            <OrderCard
              key={pesanan.idPesanan}
              title={pesanan.nomorMeja ?? "Take Away"}
              status={pesanan.statusPesanan}
              itemCount={pesanan.detailPesanan?.length}
              items={pesanan.detailPesanan ?? []}
              total={pesanan.totalTagihan}
              actionLabel="Selesai Disajikan"
              onAction={() => handleSelesaiDisajikan(pesanan.idPesanan)}
            />
          ))}
        </div>
      )}
    </main>
  );
}