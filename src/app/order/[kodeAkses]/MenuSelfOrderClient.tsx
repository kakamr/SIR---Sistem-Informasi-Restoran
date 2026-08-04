"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryTabs from "@/components/selforder/CategoryTabs";
import MenuCardSelfOrder from "@/components/selforder/MenuCardSelfOrder";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import type { Menu } from "@/lib/types";
import Image from "next/image";

export default function MenuSelfOrderClient({
  menuList,
  nomorMeja,
  kodeAkses,
}: {
  menuList: Menu[];
  nomorMeja: string;
  idMeja: string;
  kodeAkses: string;
}) {
  const router = useRouter();
  const { totalItem, totalHarga } = useCart();
  const [kategori, setKategori] = useState("All");
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredMenu = menuList.filter((m) => {
    const matchKategori = kategori === "All" || m.kategori === kategori;
    const matchSearch = m.namaMenu.toLowerCase().includes(search.toLowerCase());
    return matchKategori && matchSearch;
  });

  return (
    <div className="max-w-md mx-auto pb-28">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">SIR</p>
          <h1 className="text-2xl font-bold">Meja {nomorMeja}</h1>
        </div>

        {isSearchOpen ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => !search && setIsSearchOpen(false)}
            placeholder="Cari Item"
            className="w-40 h-11 bg-[#fdf8f0] rounded-full px-4 py-2 outline-none border border-black/10"
          />
        ) : (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-11 h-11 bg-[#fdf8f0] border border-black/10 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Cari"
          >
            <Image src="/icons/selforder/Search.png" alt="Cari" width={20} height={20}/>
          </button>
        )}
      </header>

      <div className="px-5">
        <h2 className="font-bold text-lg mb-3">Menu</h2>
        <CategoryTabs active={kategori} onChange={setKategori} />

        <div className="flex flex-col gap-3 mt-4">
          {filteredMenu.map((menu) => (
            <MenuCardSelfOrder key={menu.idMenu} menu={menu} />
          ))}
          {filteredMenu.length === 0 && (
            <p className="text-center text-black/40 py-8">Menu tidak ditemukan</p>
          )}
        </div>
      </div>

      {totalItem > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4">
          <button
            onClick={() => router.push(`/order/${kodeAkses}/pesanan`)}
            className="w-full bg-[#2d5a4a] text-white rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm text-white/80">{totalItem} Item</p>
              <p className="text-xs text-white/60">Total Harga</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{formatRupiah(totalHarga)}</span>
              <span>
                <Image src="/icons/selforder/Keranjang.png" alt="Keranjang" width={30} height={30}/>
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}