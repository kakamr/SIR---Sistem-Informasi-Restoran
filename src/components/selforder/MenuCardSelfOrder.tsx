"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import CatatanModal from "./CatatanModal";
import { useCart } from "@/lib/cart-context";
import type { Menu } from "@/lib/types";
import Image from "next/image";

export default function MenuCardSelfOrder({ menu }: { menu: Menu }) {
  const { cartItems, addItem, updateQty, updateCatatan } = useCart();
  const [isCatatanOpen, setIsCatatanOpen] = useState(false);

  const cartItem = cartItems.find((i) => i.idMenu === menu.idMenu);
  const qty = cartItem?.jumlah ?? 0;

  function handleTambahPertama() {
    addItem({ idMenu: menu.idMenu, namaMenu: menu.namaMenu, harga: menu.harga, gambarUrl: menu.gambarUrl }, 1);
  }

  return (
    <>
      <div className="bg-[#fdf8f0] rounded-xl p-4 flex gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-300">
          {menu.gambarUrl ? (
            <Image
              src={menu.gambarUrl}
              alt={menu.namaMenu}
              fill
              className="object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 rounded-lg shrink-0" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-tight">{menu.namaMenu}</h3>
          <p className="text-xs text-black/50 mt-0.5 line-clamp-1">{menu.deskripsi}</p>
          <p className="font-bold mt-1">{formatRupiah(menu.harga)}</p>

          <div className="flex justify-end mt-2">
            {qty === 0 ? (
              <button
                onClick={handleTambahPertama}
                className="bg-[#2d5a4a] text-white text-sm font-semibold px-5 py-2 rounded-full"
              >
                Tambah
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCatatanOpen(true)}
                  className="w-8 h-8 border border-[#2d5a4a] text-[#2d5a4a] rounded-lg flex items-center justify-center"
                  aria-label="Catatan"
                >
                  ✎
                </button>
                <button
                  onClick={() => updateQty(menu.idMenu, qty - 1)}
                  className="w-8 h-8 bg-[#2d5a4a] text-white rounded-full flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-5 text-center font-semibold">{qty}</span>
                <button
                  onClick={() => updateQty(menu.idMenu, qty + 1)}
                  className="w-8 h-8 bg-[#2d5a4a] text-white rounded-full flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CatatanModal
        isOpen={isCatatanOpen}
        onClose={() => setIsCatatanOpen(false)}
        initialValue={cartItem?.catatanItem ?? ""}
        onSave={(catatan) => updateCatatan(menu.idMenu, catatan)}
      />
    </>
  );
}