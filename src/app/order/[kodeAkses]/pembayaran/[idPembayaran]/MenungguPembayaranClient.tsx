"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePolling } from "@/lib/hooks/usePolling";
import { confirmPembayaranSelfOrder, getPembayaranStatus } from "@/lib/actions/pesanan-selforder";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import Image from "next/image";

interface PembayaranData {
  id_pembayaran: number;
  id_pesanan: number;
  id_meja: number;
  metode_pembayaran: string;
  jumlah_bayar: number;
  status_pembayaran: "menunggu" | "berhasil" | "gagal";
  nomor_meja: string;
  kode_akses: string;
}

const isVA = (m: string) => m.endsWith("_va");

const PAYMENT_ICONS: Record<string, string> = {
  gopay: "/icons/payment/gopay.png",
  dana: "/icons/payment/dana.png",
  bri_va: "/icons/payment/bri_va.png",
  bca_va: "/icons/payment/bca_va.png",
  bni_va: "/icons/payment/bni_va.png",
  qris: "/icons/payment/qris.png",
};

export default function MenungguPembayaranClient({
  initialData,
}: {
  initialData: PembayaranData;
}) {
  const router = useRouter();

  const { data } = usePolling(
    () => getPembayaranStatus(initialData.id_pembayaran),
    2000,
    true
  );

  const currentData = data ?? initialData;
  const iconMetode = PAYMENT_ICONS[currentData.metode_pembayaran];

  useEffect(() => {
    if (data?.status_pembayaran === "berhasil") {
      router.replace(
        `/order/${data.kode_akses}/pembayaran/${data.id_pembayaran}/berhasil`
      );
    }
  }, [data, router]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await confirmPembayaranSelfOrder(
        initialData.id_pembayaran
      );

      if (result.success) {
        router.replace(
          `/order/${initialData.kode_akses}/pembayaran/${initialData.id_pembayaran}/berhasil`
        );
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [initialData, router]);

  const batasWaktu = new Date(
    Date.now() + 5 * 60 * 1000
  ).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="max-w-md mx-auto pb-28">

      <div className="bg-[#fdf8f0] px-5 pt-10 pb-8 rounded-b-3xl text-center">
        <div className="w-16 h-16 border-2 border-[#2d5a4a] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⏱
        </div>

        <p className="text-black/70">
          Pesanan Berhasil Dibuat
        </p>

        <p className="text-3xl font-bold mt-1">
          {formatRupiah(currentData.jumlah_bayar)}
        </p>
      </div>

      <div className="px-5 -mt-6">

        <div className="bg-[#2d5a4a] text-[#fdf8f0] rounded-xl p-4 flex items-center gap-3 mb-4">
          <Image
            src="/icons/status/Time.png"
            alt="Menunggu"
            width={30}
            height={30}
          />

          <div>
            <p className="text-sm">
              Selesaikan pembayaran sebelum
            </p>

            <p className="font-bold">
              {batasWaktu}
            </p>
          </div>
        </div>

        <div className="bg-[#fdf8f0] rounded-xl p-4 mb-4">

          <div className="flex justify-between text-sm mb-2">
            <span>ID Pembayaran</span>

            <span className="font-semibold">
              PMB
              {String(currentData.id_pembayaran).padStart(
                6,
                "0"
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm mb-4">
            <span>No Meja</span>

            <span className="font-semibold">
              {currentData.nomor_meja}
            </span>
          </div>

          {isVA(currentData.metode_pembayaran) ? (
            <div className="bg-[#fdf8f0] rounded-xl p-4 flex items-center justify-between">

              <div>

                <p className="text-xs text-black/50">
                  Nomor Rekening Virtual
                </p>

                <p className="font-bold text-lg tracking-wide">
                  0000
                  {String(currentData.id_pembayaran).padStart(
                    8,
                    "0"
                  )}
                </p>

                <p className="text-xs text-black/50 mt-2">
                  Total Tagihan
                </p>

                <p className="font-bold">
                  {formatRupiah(currentData.jumlah_bayar)}
                </p>

              </div>

              <div className="w-10 h-10 bg-[#fdf8f0] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {iconMetode ? (
                  <Image
                    src={iconMetode}
                    alt={currentData.metode_pembayaran}
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#fdf8f0] rounded-xl p-4">

              <p className="text-xs text-black/50 mb-2">
                QR QRIS
              </p>
            
              <div className="w-full aspect-square rounded-lg mb-3 overflow-hidden relative">
                <Image
                  src="/icons/payment/qris_placeholder.png"
                  alt="QR QRIS"
                  fill
                  className="object-contain"
                />
              </div>
            
              <p className="text-xs text-black/50">
                Total Tagihan
              </p>
            
              <p className="font-bold">
                {formatRupiah(currentData.jumlah_bayar)}
              </p>
            
            </div>
          )}

        </div>

        <p className="text-center text-sm text-black/40 mt-6">
          Menunggu konfirmasi pembayaran...
        </p>

      </div>

    </div>
  );
}