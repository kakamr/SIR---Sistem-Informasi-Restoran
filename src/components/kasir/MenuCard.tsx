"use client";

import { formatRupiah } from "@/lib/utils/formatCurrency";
import type { CartItem, Menu } from "@/lib/types";
import Image from "next/image";

interface MenuCardProps {
  menu: Menu;
  cartItems: CartItem[];
  onAddToCart: (menu: Menu, jumlah: number) => void;
  onUpdateQty: (idMenu: number, jumlah: number) => void;
}

export default function MenuCard({
  menu,
  cartItems,
  onAddToCart,
  onUpdateQty,
}: MenuCardProps) {
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

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5 flex flex-col">
      {menu.gambarUrl ? (
        <Image
          src={menu.gambarUrl}
          alt={menu.namaMenu}
          className="w-full aspect-square object-cover rounded-lg mb-4"
          width={200}
          height={200}
        />
      ) : (
        <div className="w-full aspect-square bg-gray-300 rounded-lg mb-4" />
      )}

      <h3 className="font-semibold text-lg leading-tight">
        {menu.namaMenu}
      </h3>

      <p className="text-sm text-black/50 mt-1 line-clamp-1">
        {menu.deskripsi}
      </p>

      <p className="text-xl font-bold mt-2">
        {formatRupiah(menu.harga)}
      </p>

      <div className="flex justify-center items-center gap-5 mt-4">
        <button
          onClick={handleKurang}
          disabled={qty === 0}
          className="w-10 h-10 bg-[#2d5a4a] text-white rounded-lg font-bold disabled:opacity-40"
        >
          −
        </button>

        <span className="w-8 text-center text-xl font-bold">
          {qty}
        </span>

        <button
          onClick={handleTambah}
          className="w-10 h-10 bg-[#2d5a4a] text-white rounded-lg font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}