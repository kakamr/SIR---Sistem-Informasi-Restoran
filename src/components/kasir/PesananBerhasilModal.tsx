"use client";

import { formatRupiah } from "@/lib/utils/formatCurrency";
import TombolCetakStruk from "./TombolCetakStruk";
import type { CartItem, JenisLayanan, Meja } from "@/lib/types";

interface PesananBerhasilModalProps {
  isOpen: boolean;
  onClose: () => void;
  jenisLayanan: JenisLayanan;
  selectedMeja: Meja | null;
  cartItems: CartItem[];
  metodeBayar: string | null;
  total: number;
  nomorAntrian?: string | null;
  idPesanan?: number | null;
}

const METODE_LABEL: Record<string, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  edc: "Debit/EDC",
};

export default function PesananBerhasilModal({
  isOpen,
  onClose,
  jenisLayanan,
  selectedMeja,
  cartItems,
  metodeBayar,
  total,
  nomorAntrian,
  idPesanan,
}: PesananBerhasilModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[110] p-6">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#fdf8f0] px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 border-2 border-[#2d5a4a] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl text-[#2d5a4a]">
            ✓
          </div>
          <p className="text-black/70">Pesanan Berhasil Dibuat</p>
          <p className="text-3xl font-bold mt-1">{formatRupiah(total)}</p>
        </div>

        {nomorAntrian && (
          <div className="bg-[#2d5a4a] text-white text-center py-5">
            <p className="text-sm opacity-80">Nomor Antrian</p>
            <p className="text-5xl font-bold tracking-wide mt-1">{nomorAntrian}</p>
            <p className="text-xs opacity-80 mt-2">Sampaikan nomor ini ke pelanggan</p>
          </div>
        )}

        <div className="px-6 py-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-black/60">Jenis Layanan</span>
            <span className="font-semibold">
              {jenisLayanan === "dine_in" ? "Dine In" : "Take Away"}
            </span>
          </div>
          {jenisLayanan === "dine_in" && selectedMeja && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-black/60">Meja</span>
              <span className="font-semibold">{selectedMeja.nomorMeja}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-4">
            <span className="text-black/60">Metode Bayar</span>
            <span className="font-semibold">
              {metodeBayar ? METODE_LABEL[metodeBayar] : "-"}
            </span>
          </div>

          <div className="border-t border-black/10 pt-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.idMenu} className="flex justify-between text-sm">
                <span className="text-black/80">
                  {item.jumlah}x {item.namaMenu}
                </span>
                <span className="font-medium">{formatRupiah(item.harga * item.jumlah)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2">
          {idPesanan && <TombolCetakStruk idPesanan={idPesanan} />}
          <button
            onClick={onClose}
            className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3"
          >
            Pesanan Baru
          </button>
        </div>
      </div>
    </div>
  );
}