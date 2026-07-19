"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { CartItemSelfOrder } from "@/lib/types";

interface CartContextValue {
  cartItems: CartItemSelfOrder[];
  addItem: (item: Omit<CartItemSelfOrder, "jumlah">, jumlah: number) => void;
  updateQty: (idMenu: number, jumlah: number) => void;
  updateCatatan: (idMenu: number, catatan: string) => void;
  clearCart: () => void;
  totalItem: number;
  totalHarga: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  idMeja,
  children,
}: {
  idMeja: string;
  children: React.ReactNode;
}) {
  const storageKey = `sir_cart_meja_${idMeja}`;
  const [cartItems, setCartItems] = useState<CartItemSelfOrder[]>([]);

  // Load dari localStorage saat mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch {
        // ignore corrupted data
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan ke localStorage tiap kali berubah
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, storageKey]);

  function addItem(item: Omit<CartItemSelfOrder, "jumlah">, jumlah: number) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.idMenu === item.idMenu);
      if (existing) {
        return prev.map((i) =>
          i.idMenu === item.idMenu ? { ...i, jumlah: i.jumlah + jumlah } : i
        );
      }
      return [...prev, { ...item, jumlah }];
    });
  }

  function updateQty(idMenu: number, jumlah: number) {
    setCartItems((prev) => {
      if (jumlah <= 0) return prev.filter((i) => i.idMenu !== idMenu);
      return prev.map((i) => (i.idMenu === idMenu ? { ...i, jumlah } : i));
    });
  }

  function updateCatatan(idMenu: number, catatan: string) {
    setCartItems((prev) =>
      prev.map((i) => (i.idMenu === idMenu ? { ...i, catatanItem: catatan } : i))
    );
  }

  function clearCart() {
    setCartItems([]);
    localStorage.removeItem(storageKey);
  }

  const totalItem = cartItems.reduce((sum, i) => sum + i.jumlah, 0);
  const totalHarga = cartItems.reduce((sum, i) => sum + i.harga * i.jumlah, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addItem, updateQty, updateCatatan, clearCart, totalItem, totalHarga }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}