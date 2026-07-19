"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import CatatanModal from "@/components/selforder/CatatanModal";
import Image from "next/image";

const PAJAK_PERSEN = 0.01;

interface PesananClientProps {
  nomorMeja: string;
  kodeAkses: string;
}

export default function PesananClient({ nomorMeja, kodeAkses }: PesananClientProps) {
  const router = useRouter();
  const { cartItems, updateQty, updateCatatan } = useCart();
  const [editingIdMenu, setEditingIdMenu] = useState<number | null>(null);

  const subtotal = cartItems.reduce((sum, i) => sum + i.harga * i.jumlah, 0);
  const pajak = Math.round(subtotal * PAJAK_PERSEN);
  const diskon = 0;
  const total = subtotal + pajak - diskon;

  const editingItem = cartItems.find((i) => i.idMenu === editingIdMenu);

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
        <h2 className="font-bold text-lg mb-3">Pesanan</h2>

        <div className="bg-[#fdf8f0] rounded-xl p-4 flex flex-col gap-4 mb-5">
          {cartItems.map((item, idx) => (
            <div key={item.idMenu}>
              <div className="flex gap-3">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-300">
                  {item.gambarUrl ? (
                    <Image
                      src={item.gambarUrl}
                      alt={item.namaMenu}
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-300 rounded-lg shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{item.namaMenu}</p>
                  {item.catatanItem && (
                    <p className="text-xs text-black/50 mt-0.5 line-clamp-1">
                      Catatan : {item.catatanItem}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold">{formatRupiah(item.harga)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingIdMenu(item.idMenu)}
                        className="w-7 h-7 border border-[#2d5a4a] text-[#2d5a4a] rounded-md flex items-center justify-center text-sm"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => updateQty(item.idMenu, item.jumlah - 1)}
                        className="w-7 h-7 bg-[#2d5a4a] text-white rounded-full text-sm"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{item.jumlah}</span>
                      <button
                        onClick={() => updateQty(item.idMenu, item.jumlah + 1)}
                        className="w-7 h-7 bg-[#2d5a4a] text-white rounded-full text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {idx < cartItems.length - 1 && <div className="border-t border-black/10 mt-4" />}
            </div>
          ))}

          {cartItems.length === 0 && (
            <p className="text-center text-black/40 py-8">Keranjang kosong</p>
          )}
        </div>

        <h2 className="font-bold text-lg mb-3">Pembayaran</h2>
        <div className="bg-[#fdf8f0] rounded-xl p-4 mb-5">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{diskon}</span>
            </div>
            <div className="flex justify-between">
              <span>Pajak</span>
              <span>{pajak}</span>
            </div>
          </div>
          <div className="border-t-2 border-black/80 mt-3 pt-3 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl">{total}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-[#e2e2e2]">
        <button
          onClick={() => router.push(`/order/${kodeAkses}/metode-pembayaran`)}
          disabled={cartItems.length === 0}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-full py-4 disabled:opacity-50"
        >
          Bayar
        </button>
      </div>

      <CatatanModal
        isOpen={editingIdMenu !== null}
        onClose={() => setEditingIdMenu(null)}
        initialValue={editingItem?.catatanItem ?? ""}
        onSave={(catatan) => editingIdMenu && updateCatatan(editingIdMenu, catatan)}
      />
    </div>
  );
}