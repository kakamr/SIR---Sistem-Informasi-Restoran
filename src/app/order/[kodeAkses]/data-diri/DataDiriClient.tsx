"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";

interface DataDiriClientProps {
  nomorMeja: string;
  kodeAkses: string;
}

export default function DataDiriClient({ nomorMeja, kodeAkses }: DataDiriClientProps) {
  const router = useRouter();
  const { dataPelanggan, setDataPelanggan } = useCart();
  const [nama, setNama] = useState(dataPelanggan.namaPelanggan ?? "");
  const [telepon, setTelepon] = useState(dataPelanggan.noTelepon ?? "");

  function handleLanjut() {
    setDataPelanggan({
      namaPelanggan: nama.trim() || undefined,
      noTelepon: telepon.trim() || undefined,
    });
    router.push(`/order/${kodeAkses}/metode-pembayaran`);
  }

  function handleLewati() {
    setDataPelanggan({});
    router.push(`/order/${kodeAkses}/metode-pembayaran`);
  }

  return (
    <div className="max-w-md mx-auto pb-32">
      <header className="px-5 pt-6 pb-4 flex items-center gap-3 bg-[#fdf8f0]">
        <button onClick={() => router.back()} aria-label="Kembali" className="text-2xl">
          ←
        </button>
        <div>
          <p className="text-sm font-bold">SIR</p>
          <h1 className="text-2xl font-bold">Meja {nomorMeja}</h1>
        </div>
      </header>

      <div className="px-5 pt-5">
        <h2 className="font-bold text-lg mb-1">Data Diri</h2>
        <p className="text-sm text-black/50 mb-5">
          Opsional — boleh dilewati kalau tidak ingin mengisi.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Nama</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama Anda"
              className="w-full bg-[#fdf8f0] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2d5a4a]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">No. Telepon</label>
            <input
              type="tel"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full bg-[#fdf8f0] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#2d5a4a]"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#e2e2e2] flex flex-col gap-2">
        <button
          onClick={handleLanjut}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4"
        >
          Lanjutkan
        </button>
        <button
          onClick={handleLewati}
          className="w-full text-[#2d5a4a] font-semibold py-2"
        >
          Lewati
        </button>
      </div>
    </div>
  );
}