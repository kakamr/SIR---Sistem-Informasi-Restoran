"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import OrderCard from "@/components/shared/OrderCard";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import { getPesananList, cancelPesanan } from "@/lib/actions/pesanan";
import type { Pesanan } from "@/lib/types";

export default function PesananClient({ initialPesanan }: { initialPesanan: Pesanan[] }) {
  const [pesananToCancel, setPesananToCancel] = useState<Pesanan | null>(null);

  const { data } = usePolling(getPesananList, 3000, pesananToCancel === null);
  const pesananList = data ?? initialPesanan;

  function bisaDibatalkan(pesanan: Pesanan) {
    // Cuma boleh batal kalau pesanan masih diproses DAN
    // koki belum mulai masak (tiket masih 'menunggu' atau belum ada tiket sama sekali)
    return (
      pesanan.statusPesanan === "diproses" &&
      (pesanan.statusTiket === "menunggu" || pesanan.statusTiket === null)
    );
  }

  async function handleConfirmCancel() {
    if (!pesananToCancel) return;

    const result = await cancelPesanan(pesananToCancel.idPesanan);
    if (!result.success) {
      alert(result.message);
    }
    setPesananToCancel(null);
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="grid grid-cols-4 gap-5">
        {pesananList.map((pesanan) => (
          <OrderCard
            key={pesanan.idPesanan}
            title={pesanan.nomorMeja ?? "Take Away"}
            itemCount={pesanan.detailPesanan?.length}
            status={pesanan.statusPesanan}
            items={pesanan.detailPesanan ?? []}
            total={pesanan.totalTagihan}
            actionLabel={bisaDibatalkan(pesanan) ? "Batalkan Pesanan" : undefined}
            onAction={bisaDibatalkan(pesanan) ? () => setPesananToCancel(pesanan) : undefined}
          />
        ))}
      </div>
      {pesananList.length === 0 && (
        <p className="text-center text-black/40 mt-12">Belum ada pesanan</p>
      )}

      <ConfirmDeleteModal
        isOpen={pesananToCancel !== null}
        title="Batalkan Pesanan"
        description={
          pesananToCancel
            ? `Apakah Anda yakin ingin membatalkan pesanan di "${pesananToCancel.nomorMeja ?? "Take Away"}"?`
            : ""
        }
        warningText="Stok bahan baku akan dikembalikan otomatis."
        confirmLabel="Batalkan"
        onClose={() => setPesananToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </main>
  );
}