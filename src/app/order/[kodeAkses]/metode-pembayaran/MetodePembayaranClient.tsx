"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PaymentMethodAccordion from "@/components/selforder/PaymentMethodAccordion";
import { useCart } from "@/lib/cart-context";
import { createPesananSelfOrder } from "@/lib/actions/pesanan-selforder";
import type { MetodePembayaranSelfOrder } from "@/lib/types";

const PAJAK_PERSEN = 0.01;

interface MetodePembayaranClientProps {
  idMeja: number;
  nomorMeja: string;
  kodeAkses: string;
}

export default function MetodePembayaranClient({
  idMeja,
  nomorMeja,
  kodeAkses,
}: MetodePembayaranClientProps) {
  const router = useRouter();
  const { cartItems, clearCart, dataPelanggan } = useCart();
  const [selected, setSelected] = useState<MetodePembayaranSelfOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePesan() {
    if (!selected || cartItems.length === 0) return;

    setIsSubmitting(true);

    const subtotal = cartItems.reduce((sum, i) => sum + i.harga * i.jumlah, 0);
    const pajak = Math.round(subtotal * PAJAK_PERSEN);
    const total = subtotal + pajak;

    const result = await createPesananSelfOrder({
      idMeja,
      cartItems,
      metodePembayaran: selected,
      total,
      namaPelanggan: dataPelanggan.namaPelanggan,
      noTelepon: dataPelanggan.noTelepon,
    });

    setIsSubmitting(false);

    if (!result.success || !result.idPembayaran) {
      alert(result.message ?? "Gagal membuat pesanan");
      return;
    }

    clearCart();
    router.push(`/order/${kodeAkses}/pembayaran/${result.idPembayaran}`);
  }

  return (
    <div className="max-w-md mx-auto pb-28">
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
        <h2 className="font-bold text-lg mb-4">Metode Pembayaran</h2>
        <PaymentMethodAccordion selected={selected} onSelect={setSelected} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#e2e2e2]">
        <button
          onClick={handlePesan}
          disabled={!selected || isSubmitting}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4 disabled:opacity-50"
        >
          {isSubmitting ? "Memproses..." : "Pesan"}
        </button>
      </div>
    </div>
  );
}