"use client";

import { useState, useEffect } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import { useNewItemNotification } from "@/lib/hooks/useNewItemNotification";
import OrderCard from "@/components/shared/OrderCard";
import ToastNotification from "@/components/shared/ToastNotification";
import { updateStatusPesanan, getPesananSiapSaji } from "@/lib/actions/pesanan";
import type { Pesanan } from "@/lib/types";

export default function PenyajianClient({ initialPesanan }: { initialPesanan: Pesanan[] }) {
  const { data } = usePolling(getPesananSiapSaji, 3000);

  const [justCompleted, setJustCompleted] = useState<Set<number>>(new Set());
  const pesananSiapSaji = (data ?? initialPesanan).filter((p) => !justCompleted.has(p.idPesanan));
  const [error, setError] = useState("");

  const { toastMessage, dismissToast } = useNewItemNotification(
    pesananSiapSaji,
    (item) => item.idPesanan,
    "/sounds/pesanan-siap.mp3" // ganti sesuai nama file audio kalian
  );

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(dismissToast, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastMessage]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  async function handleSelesaiDisajikan(idPesanan: number) {
    setJustCompleted((prev) => new Set(prev).add(idPesanan));

    const result = await updateStatusPesanan(idPesanan, "selesai");
    if (!result.success) {
      setError("Gagal update status, silakan coba lagi");
      setJustCompleted((prev) => {
        const next = new Set(prev);
        next.delete(idPesanan);
        return next;
      });
    }
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <ToastNotification
        message={toastMessage ?? ""}
        isVisible={toastMessage !== null}
        onClose={dismissToast}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-bold px-2">
            ×
          </button>
        </div>
      )}

      {pesananSiapSaji.length === 0 ? (
        <p className="text-center text-black/40 mt-16 text-lg">Kosong</p>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {pesananSiapSaji.map((pesanan) => (
            <OrderCard
              key={pesanan.idPesanan}
              title={pesanan.nomorMeja ?? pesanan.nomorAntrian ?? "Take Away"}
              subtitle={pesanan.nomorMeja ? undefined : "Take Away"}
              status="siap_disajikan"
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