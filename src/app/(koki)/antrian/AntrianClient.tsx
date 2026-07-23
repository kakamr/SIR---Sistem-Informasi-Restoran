"use client";

import { useState, useEffect } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import { useNewItemNotification } from "@/lib/hooks/useNewItemNotification";
import OrderCard from "@/components/shared/OrderCard";
import ToastNotification from "@/components/shared/ToastNotification";
import { updateStatusTiket, getAntrianDapur } from "@/lib/actions/tiket";
import type { StatusTiket, StatusPesanan } from "@/lib/types";

interface AntrianItem {
  idTiket: number;
  idPesanan: number;
  statusTiket: StatusTiket;
  statusPesanan: StatusPesanan;
  waktuMasukDapur: string;
  jenisLayanan: string;
  nomorMeja: string | null;
  detailPesanan: {
    idDetail: number;
    idPesanan: number;
    idMenu: number;
    namaMenu: string;
    jumlah: number;
    hargaSatuan: number;
    subtotal: number;
  }[];
}

function formatTanggalPendek(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AntrianClient({ initialAntrian }: { initialAntrian: AntrianItem[] }) {
  const { data } = usePolling(getAntrianDapur, 3000);
  const antrian = data ?? initialAntrian;
  const [error, setError] = useState("");

  const pesananBaru = antrian.filter((a) => a.statusTiket === "menunggu");
  const diproses = antrian.filter((a) => a.statusTiket === "diproses");
  const siapDisajikan = antrian.filter((a) => a.statusTiket === "selesai");

  // Notifikasi khusus untuk kolom "Pesanan Baru" - koki perlu tahu ada order masuk
  const { toastMessage, dismissToast } = useNewItemNotification(
    pesananBaru,
    (item) => item.idTiket,
    "/sounds/pesanan-baru.mp3" // ganti sesuai nama file audio kalian
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

  async function handleUpdateStatus(idTiket: number, statusBaru: StatusTiket) {
    const result = await updateStatusTiket(idTiket, statusBaru);
    if (!result.success) {
      setError("Gagal update status, silakan coba lagi");
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

      <div className="grid grid-cols-3 gap-6 items-start">
        <AntrianColumn title="Pesanan Baru" count={pesananBaru.length}>
          {pesananBaru.map((a) => (
            <OrderCard
              key={a.idTiket}
              title={a.nomorMeja ?? "Take Away"}
              subtitle={formatTanggalPendek(a.waktuMasukDapur)}
              items={a.detailPesanan}
              actionLabel="Mulai Masak"
              onAction={() => handleUpdateStatus(a.idTiket, "diproses")}
            />
          ))}
        </AntrianColumn>

        <AntrianColumn title="Diproses" count={diproses.length}>
          {diproses.map((a) => (
            <OrderCard
              key={a.idTiket}
              title={a.nomorMeja ?? "Take Away"}
              subtitle={formatTanggalPendek(a.waktuMasukDapur)}
              items={a.detailPesanan}
              actionLabel="Selesai"
              onAction={() => handleUpdateStatus(a.idTiket, "selesai")}
            />
          ))}
        </AntrianColumn>

        <AntrianColumn title="Siap Disajikan" count={siapDisajikan.length}>
          {siapDisajikan.map((a) => (
            <OrderCard
              key={a.idTiket}
              title={a.nomorMeja ?? "Take Away"}
              subtitle={formatTanggalPendek(a.waktuMasukDapur)}
              items={a.detailPesanan}
            />
          ))}
        </AntrianColumn>
      </div>
    </main>
  );
}

function AntrianColumn({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <span className="bg-[#2d5a4a] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {children}
        {count === 0 && <p className="text-center text-black/40 py-8">Kosong</p>}
      </div>
    </div>
  );
}