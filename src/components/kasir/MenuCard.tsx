"use client";
import { useState } from "react";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import type { CartItem, Menu } from "@/lib/types";
import Image from "next/image";
import CatatanModal from "./CatatanModal";

interface MenuCardProps {
  menu: Menu;
  cartItems: CartItem[];
  onAddToCart: (menu: Menu, jumlah: number) => void;
  onUpdateQty: (idMenu: number, jumlah: number) => void;
  onUpdateCatatan: (idMenu: number, catatan: string) => void;
}

export default function MenuCard({
  menu,
  cartItems,
  onAddToCart,
  onUpdateQty,
  onUpdateCatatan,
}: MenuCardProps) {
  const [isCatatanOpen, setIsCatatanOpen] = useState(false);

  const cartItem = cartItems.find((item) => item.idMenu === menu.idMenu);
  const qty = cartItem?.jumlah ?? 0;

  function handleTambah() {
    if (qty === 0) {
      onAddToCart(menu, 1);
    } else {
      onUpdateQty(menu.idMenu, qty + 1);
    }
  }

  function handleKurang() {
    if (qty <= 1) {
      onUpdateQty(menu.idMenu, 0);
    } else {
      onUpdateQty(menu.idMenu, qty - 1);
    }
  }

  function handleSaveCatatan(catatan: string) {
    onUpdateCatatan(menu.idMenu, catatan);
  }

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5 flex flex-col">
      {menu.gambarUrl ? (
        <Image
          src={menu.gambarUrl}
          alt={menu.namaMenu}
          className="w-full aspect-square object-cover rounded-lg mb-4"
          width={200}
          height={200}
          unoptimized
        />
      ) : (
        <div className="w-full aspect-square bg-gray-300 rounded-lg mb-4" />
      )}
      <h3 className="font-semibold text-lg leading-tight">{menu.namaMenu}</h3>
      <p className="text-sm text-black/50 mt-1 line-clamp-1">{menu.deskripsi}</p>
      <p className="text-xl font-bold mt-2">{formatRupiah(menu.harga)}</p>

      <div className="flex justify-center items-center gap-5 mt-4">
        <button
          onClick={handleKurang}
          disabled={qty === 0}
          className="w-15 h-15 flex items-center justify-center bg-[#2d5a4a] text-[#fdf8f0] rounded-lg font-bold text-2xl disabled:opacity-40"
        >
          −
        </button>
        <span className="w-8 text-center text-xl font-bold">{qty}</span>
        <button
          onClick={handleTambah}
          className="w-14 h-14 flex items-center justify-center bg-[#2d5a4a] text-[#fdf8f0] rounded-lg font-bold text-2xl"
        >
          +
        </button>
        <button
          onClick={() => setIsCatatanOpen(true)}
          disabled={qty === 0}
          aria-label="Tambah catatan"
          title={qty === 0 ? "Tambahkan menu dulu" : "Tambah catatan"}
          className="w-14 h-14 flex items-center justify-center bg-[#fdf8f0] border border-[#2d5a4a] rounded-lg disabled:opacity-40 disabled:border-gray-300"
        >
          <Image
            src="/icons/button/catatan.png"
            alt="Catatan"
            width={30}
            height={30}
            className="object-contain"
          />
        </button>
      </div>

      <CatatanModal
        isOpen={isCatatanOpen}
        namaMenu={menu.namaMenu}
        catatanAwal={cartItem?.catatanItem}
        onClose={() => setIsCatatanOpen(false)}
        onSave={handleSaveCatatan}
      />
    </div>
  );
}