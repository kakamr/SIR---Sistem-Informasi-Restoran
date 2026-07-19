"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStrukData } from "@/lib/actions/pesanan-selforder";
import { generateStrukCanvas, downloadCanvasAsImage } from "@/lib/utils/generate-struk";
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

const METODE_LABEL: Record<string, string> = {
  gopay: "Gopay",
  dana: "Dana",
  bri_va: "BRI Virtual Account",
  bca_va: "BCA Virtual Account",
  bni_va: "BNI Virtual Account",
  qris: "QRIS",
};

export default function PembayaranBerhasilClient({
  data,
}: {
  data: PembayaranData;
}) {
  const router = useRouter();

  const [isGenerating, setIsGenerating] =
    useState(false);

  async function handleSimpanStruk() {
    setIsGenerating(true);

    try {
      const struk =
        await getStrukData(
          data.id_pembayaran
        );

      if (!struk) {
        alert("Gagal mengambil data struk");
        return;
      }

      const canvas =
        await generateStrukCanvas(struk);

      downloadCanvasAsImage(
        canvas,
        `Struk_SIR_${struk.idPembayaran}.png`
      );
    } catch (err) {
      console.error(err);
      alert("Gagal membuat struk");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="max-w-md mx-auto pb-8">

      <div className="bg-[#fdf8f0] px-5 pt-10 pb-8 rounded-b-3xl text-center">

        <div className="w-16 h-16 border-2 border-[#2d5a4a] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-[#2d5a4a]">
          ✓
        </div>

        <p className="text-black/70">
          Pembayaran Telah Berhasil
        </p>

        <p className="text-3xl font-bold mt-1">
          {formatRupiah(data.jumlah_bayar)}
        </p>

      </div>

      <div className="px-5 -mt-6">

        <div className="bg-[#2d5a4a] text-white rounded-xl p-4 flex items-center gap-3 mb-4">

          <Image
            src="/icons/status/Info.png"
            alt="Berhasil"
            width={30}
            height={30}
          />

          <p className="text-sm">
            Pesananmu akan segera dibuatkan,
            tolong ditunggu ya
          </p>

        </div>

        <div className="bg-[#fdf8f0] rounded-xl p-4 mb-4">

          <h3 className="font-bold mb-3">
            Detail Transaksi
          </h3>

          <div className="flex flex-col gap-2 text-sm">

            <div className="flex justify-between">
              <span>ID Pembayaran</span>

              <span className="font-semibold">
                PMB
                {String(data.id_pembayaran).padStart(
                  6,
                  "0"
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>No Meja</span>

              <span className="font-semibold">
                {data.nomor_meja}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Tanggal</span>

              <span className="font-semibold">
                {new Date().toLocaleDateString(
                  "id-ID"
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Metode Pembayaran</span>

              <span className="font-semibold">
                {
                  METODE_LABEL[
                    data.metode_pembayaran
                  ]
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span>Total Pembelian</span>

              <span className="font-semibold">
                {formatRupiah(
                  data.jumlah_bayar
                )}
              </span>
            </div>

          </div>

        </div>

        <div className="flex flex-col gap-3">

          <button
            onClick={handleSimpanStruk}
            disabled={isGenerating}
            className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4 disabled:opacity-50"
          >
            {isGenerating
              ? "Membuat struk..."
              : "Simpan Struk"}
          </button>

          <button
            onClick={() =>
              router.push(
                `/order/${data.kode_akses}`
              )
            }
            className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4"
          >
            Kembali Ke Beranda
          </button>

        </div>

      </div>

    </div>
  );
}