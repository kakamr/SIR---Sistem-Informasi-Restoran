"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils/formatCurrency";
import type { CartItem, JenisLayanan, Meja } from "@/lib/types";
import Image from "next/image";

interface CartPanelProps {
  step: "pesanan" | "pembayaran";
  jenisLayanan: JenisLayanan;
  onChangeJenisLayanan: (val: JenisLayanan) => void;
  selectedMeja: Meja | null;
  onOpenTableModal: () => void;
  cartItems: CartItem[];
  onUpdateQty: (idMenu: number, jumlah: number) => void;
  onClearCart: () => void;
  onConfirmPesanan: () => void;
  onBackToPesanan: () => void;
  metodeBayar: "tunai" | "qris" | "edc" | null;
  onSelectMetodeBayar: (metode: "tunai" | "qris" | "edc") => void;
  onConfirmPembayaran: () => void;
  error: string;
  isEdit?: boolean;
  totalDibayar?: number; 
}

const PAJAK_PERSEN = 0.01; 

export default function CartPanel({
  step,
  jenisLayanan,
  onChangeJenisLayanan,
  selectedMeja,
  onOpenTableModal,
  cartItems,
  onClearCart,
  onConfirmPesanan,
  onBackToPesanan,
  metodeBayar,
  onSelectMetodeBayar,
  onConfirmPembayaran,
  error,
  isEdit = false,
  totalDibayar,
}: CartPanelProps) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.harga * item.jumlah,
    0
  );
  const pajak = Math.round(subtotal * PAJAK_PERSEN);
  const diskon = 0; 
  const total = subtotal + pajak - diskon;

  const totalDibayarLama = totalDibayar ?? 0;
  // Jumlah yang sebenarnya masih perlu dibayar saat ini:
  // - pesanan baru: sama dengan total
  // - edit pesanan: selisih antara total baru dengan yang sudah dibayar sebelumnya
  const sisaTagihan = isEdit ? total - totalDibayarLama : total;

  const [uangDiterima, setUangDiterima] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (metodeBayar !== "tunai") {
      setUangDiterima("");
      setLocalError("");
    }
  }, [metodeBayar]);

  const uangDiterimaNum = Number(uangDiterima.replace(/\D/g, "")) || 0;
  const kembalian = uangDiterimaNum - sisaTagihan;

  function handleKlikKonfirmasi() {
    if (metodeBayar === "tunai" && uangDiterimaNum < sisaTagihan) {
      setLocalError("Uang diterima kurang dari sisa tagihan");
      return;
    }
    setLocalError("");
    onConfirmPembayaran();
  }

  if (step === "pembayaran") {
    return (
      <div className="w-[420px] h-full bg-[#fdf8f0] p-8 flex flex-col shrink-0 overflow-y-auto">
        <button
          onClick={onBackToPesanan}
          className="text-2xl mb-4 w-fit"
          aria-label="Kembali"
        >
          ←
        </button>
        <h2 className="text-2xl font-bold mb-6">Pembayaran</h2>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => onSelectMetodeBayar("tunai")}
            className={`rounded-lg p-4 flex items-center gap-4 transition-colors ${
              metodeBayar === "tunai"
                ? "bg-[#2d5a4a] text-[#fdf8f0]"
                : "bg-gray-300 text-black/60"
            }`}
          >
            <Image
              src="/icons/payment/cash.png"
              alt="Cash"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-semibold">Cash / Tunai</span>
          </button>
          <button
            onClick={() => onSelectMetodeBayar("qris")}
            className={`rounded-lg p-4 flex items-center gap-4 transition-colors ${
              metodeBayar === "qris"
                ? "bg-[#2d5a4a] text-[#fdf8f0]"
                : "bg-gray-300 text-black/60"
            }`}
          >
            <Image
              src="/icons/payment/qris_wh.png"
              alt="Cash"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-semibold">QRIS</span>
          </button>
          <button
            onClick={() => onSelectMetodeBayar("edc")}
            className={`rounded-lg p-4 flex items-center gap-4 transition-colors ${
              metodeBayar === "edc"
                ? "bg-[#2d5a4a] text-[#fdf8f0]"
                : "bg-gray-300 text-black/60"
            }`}
          >
            <Image
              src="/icons/payment/debit.png"
              alt="Cash"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className="font-semibold">Debit / EDC</span>
          </button>
        </div>

        <div className="flex-1" />

        <RingkasanTotal subtotal={subtotal} diskon={diskon} pajak={pajak} total={total} />

        {metodeBayar === "tunai" && (
          <div className="mt-4 rounded-lg bg-[#fdf8f0] border border-black/10 p-4 flex flex-col gap-3">
            {isEdit && (
              <div className="flex flex-col gap-1.5 text-sm text-black/60 border-b border-black/10 pb-3">
                <div className="flex justify-between">
                  <span>Sudah Dibayar</span>
                  <span className="font-semibold text-black">
                    {formatRupiah(totalDibayarLama)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Setelah Diubah</span>
                  <span className="font-semibold text-black">
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold block mb-1.5">
                Uang Diterima
              </label>
              <div className="flex items-center bg-white border border-black/10 rounded-lg px-4 py-2.5">
                <span className="text-black/50 font-semibold mr-2">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={uangDiterima ? Number(uangDiterima).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setUangDiterima(digits);
                    if (localError) setLocalError("");
                  }}
                  placeholder="0"
                  className="flex-1 outline-none font-semibold text-right"
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-black/10 pt-3">
              <span className={`font-semibold ${kembalian < 0 ? "text-red-600" : "text-[#2d5a4a]"}`}>
                {kembalian < 0 ? "Kurang Bayar" : "Kembalian"}
              </span>
              <span className={`font-bold text-lg ${kembalian < 0 ? "text-red-600" : "text-[#2d5a4a]"}`}>
                {formatRupiah(Math.abs(kembalian))}
              </span>
            </div>
          </div>
        )}

        {isEdit && metodeBayar !== "tunai" && totalDibayar !== undefined && (
          <SelisihBayar totalBaru={total} totalDibayar={totalDibayar} />
        )}

        {(localError || error) && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {localError || error}
          </div>
        )}

        <button
          onClick={handleKlikKonfirmasi}
          className="w-full bg-[#2d5a4a] text-[#fdf8f0] font-semibold rounded-lg py-4 mt-4"
        >
          {isEdit ? "Simpan Perubahan" : "Konfirmasi Pembayaran"}
        </button>
      </div>
    );
  }

  return (
    <div className="w-[420px] bg-[#fdf8f0] p-8 flex flex-col shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{isEdit ? "Edit Pesanan" : "Pesanan"}</h2>
        <button
          onClick={onClearCart}
          className="bg-[#2d5a4a] text-[#fdf8f0] text-sm px-4 py-1.5 rounded-full"
        >
          Clear
        </button>
      </div>

      {}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => onChangeJenisLayanan("dine_in")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            jenisLayanan === "dine_in"
              ? "bg-[#2d5a4a] text-[#fdf8f0]"
              : "bg-gray-300 text-black/60"
          }`}
        >
          Dine In
        </button>
        <button
          onClick={() => onChangeJenisLayanan("take_away")}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            jenisLayanan === "take_away"
              ? "bg-[#2d5a4a] text-[#fdf8f0]"
              : "bg-gray-300 text-black/60"
          }`}
        >
          Take Away
        </button>
      </div>

      {}
      {jenisLayanan === "dine_in" && (
        <button
          onClick={onOpenTableModal}
          className="w-full bg-[#2d5a4a] text-[#fdf8f0] rounded-lg py-3 px-4 flex items-center justify-between mb-6"
        >
          <span className="font-semibold">Nomor Meja</span>
          <span className="bg-black text-[#fdf8f0] text-sm font-bold px-3 py-1 rounded">
            {selectedMeja
              ? selectedMeja.nomorMeja.replace(/\D/g, "").padStart(2, "0")
              : "-"}
          </span>
        </button>
      )}

      {}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4">
        {cartItems.length === 0 && (
          <p className="text-black/40 text-center mt-8">Belum ada item</p>
        )}

        {cartItems.map((item) => (
          <div key={item.idMenu} className="flex gap-3">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-300">
              {item.gambarUrl ? (
                <Image
                  src={item.gambarUrl}
                  alt={item.namaMenu}
                  width={56}
                  height={56}
                  className="w-full aspect-square object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-300 rounded-lg shrink-0" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold leading-tight">{item.namaMenu}</p>
                {item.catatanItem && (
                  <p className="text-xs text-[#2d5a4a] mt-0.5">
                    Catatan: {item.catatanItem}
                  </p>
                )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-black/60">
                  {formatRupiah(item.harga)} &nbsp; {item.jumlah}x
                </span>
                <span className="font-semibold">
                  {formatRupiah(item.harga * item.jumlah)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RingkasanTotal subtotal={subtotal} diskon={diskon} pajak={pajak} total={total} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={onConfirmPesanan}
        disabled={cartItems.length === 0}
        className="w-full bg-[#2d5a4a] text-[#fdf8f0] font-semibold rounded-lg py-4 mt-4 disabled:opacity-50"
      >
        Konfirmasi Pesanan
      </button>
    </div>
  );
}

function RingkasanTotal({
  subtotal,
  diskon,
  pajak,
  total,
}: {
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
}) {
  return (
    <div className="mt-4">
      <div className="border-t-2 border-black/80 pt-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Diskon</span>
          <span>-{formatRupiah(diskon)}</span>
        </div>
        <div className="flex justify-between">
          <span>Pajak</span>
          <span>{formatRupiah(pajak)}</span>
        </div>
      </div>
      <div className="border-t-2 border-black/80 mt-3 pt-3 flex justify-between items-center">
        <span className="text-lg font-bold">Total</span>
        <span className="text-2xl font-bold">{formatRupiah(total)}</span>
      </div>
    </div>
  );
}

function SelisihBayar({
  totalBaru,
  totalDibayar,
}: {
  totalBaru: number;
  totalDibayar: number;
}) {
  const selisih = totalBaru - totalDibayar;

  return (
    <div className="mt-4 rounded-lg bg-[#fdf8f0] border border-black/10 p-4 flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between text-black/60">
        <span>Sudah dibayar</span>
        <span>{formatRupiah(totalDibayar)}</span>
      </div>
      <div className="flex justify-between text-black/60">
        <span>Total setelah diubah</span>
        <span>{formatRupiah(totalBaru)}</span>
      </div>

      <div className="border-t border-black/10 mt-1.5 pt-2 flex justify-between items-center">
        {selisih > 0 && (
          <>
            <span className="font-bold text-red-600">Kurang Bayar</span>
            <span className="font-bold text-lg text-red-600">{formatRupiah(selisih)}</span>
          </>
        )}
        {selisih < 0 && (
          <>
            <span className="font-bold text-[#2d5a4a]">Kembalian</span>
            <span className="font-bold text-lg text-[#2d5a4a]">
              {formatRupiah(Math.abs(selisih))}
            </span>
          </>
        )}
        {selisih === 0 && (
          <>
            <span className="font-bold text-black/60">Tidak ada selisih</span>
            <span className="font-bold text-lg text-black/60">{formatRupiah(0)}</span>
          </>
        )}
      </div>
    </div>
  );
}