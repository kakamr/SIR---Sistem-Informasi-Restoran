"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePolling } from "@/lib/hooks/usePolling";
import OrderCard from "@/components/shared/OrderCard";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import TombolCetakStruk from "@/components/kasir/TombolCetakStruk";
import { getPesananList, cancelPesanan } from "@/lib/actions/pesanan";
import type { Pesanan } from "@/lib/types";

export default function PesananClient({ initialPesanan }: { initialPesanan: Pesanan[] }) {
  const router = useRouter();
  const [pesananToCancel, setPesananToCancel] = useState<Pesanan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

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
    setPesananToCancel(null);

    if (!result.success) {
      setError(result.message ?? "Gagal membatalkan pesanan");
    }
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

      <p className="text-sm text-black/50 mb-4">
        Menampilkan pesanan 7 hari terakhir, ditambah semua pesanan yang masih berjalan.
        Riwayat lengkap ada di halaman Laporan.
      </p>

      <div className="grid grid-cols-4 gap-5">
        {pesananList.map((pesanan) => (
          <OrderCard
            key={pesanan.idPesanan}
            title={pesanan.nomorMeja ?? pesanan.nomorAntrian ?? "Take Away"}
            subtitle={pesanan.nomorMeja ? undefined : "Take Away"}
            itemCount={pesanan.detailPesanan?.length}
            status={pesanan.statusPesanan}
            items={pesanan.detailPesanan ?? []}
            total={pesanan.totalTagihan}
            actionLabel={bisaDibatalkan(pesanan) ? "Batalkan Pesanan" : undefined}
            onAction={bisaDibatalkan(pesanan) ? () => setPesananToCancel(pesanan) : undefined}
            extraAction={
              <TombolCetakStruk idPesanan={pesanan.idPesanan} label="Cetak Ulang Struk" />
            }
            secondaryActionLabel={bisaDibatalkan(pesanan) ? "Edit Pesanan" : undefined}
            onSecondaryAction={
              bisaDibatalkan(pesanan)
                ? () => router.push(`/pemesanan?edit=${pesanan.idPesanan}`)
                : undefined
            }
          />
        ))}
      </div>
      {pesananList.length === 0 && (
        <p className="text-center text-black/40 mt-12">
          Belum ada pesanan dalam 7 hari terakhir
        </p>
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