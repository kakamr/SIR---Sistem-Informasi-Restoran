"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import MenuCard from "@/components/kasir/MenuCard";
import CartPanel from "@/components/kasir/CartPanel";
import TableSelectModal from "@/components/kasir/TableSelectModal";
import CategoryTabs from "@/components/selforder/CategoryTabs";
import PesananBerhasilModal from "@/components/kasir/PesananBerhasilModal";
import { createPesananLengkap, updatePesananLengkap } from "@/lib/actions/pesanan";
import type { Menu, Meja, CartItem, JenisLayanan, PesananEdit } from "@/lib/types";
import { usePolling } from "@/lib/hooks/usePolling";
import { getMenuList } from "@/lib/actions/menu";
import Image from "next/image";

const PAJAK_PERSEN = 0.01;

interface PemesananClientProps {
  menuList: Menu[];
  mejaList: Meja[];
  idKaryawan: number;
  pesananEdit?: PesananEdit | null;
}

interface RingkasanPesanan {
  jenisLayanan: JenisLayanan;
  selectedMeja: Meja | null;
  cartItems: CartItem[];
  metodeBayar: string | null;
  total: number;
  nomorAntrian: string | null;
}

export default function PemesananClient({
  menuList,
  mejaList,
  idKaryawan,
  pesananEdit = null,
}: PemesananClientProps) {
  const router = useRouter();
  const isEdit = pesananEdit !== null;
  const { data: polledMenu } = usePolling(getMenuList, 10000);
  const menuAktif = (polledMenu ?? menuList).filter((m) => m.statusMenu === "aktif");

  const [kategori, setKategori] = useState("All");
  const [search, setSearch] = useState("");

  const menuListActive = menuAktif.filter((m) => {
    const matchKategori = kategori === "All" || m.kategori === kategori;
    const matchSearch = m.namaMenu.toLowerCase().includes(search.toLowerCase());
    return matchKategori && matchSearch;
  });

  const [step, setStep] = useState<"pesanan" | "pembayaran">("pesanan");
  const [jenisLayanan, setJenisLayanan] = useState<JenisLayanan>(
    pesananEdit?.jenisLayanan ?? "dine_in"
  );
  const [selectedMejaId, setSelectedMejaId] = useState<number | null>(pesananEdit?.idMeja ?? null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(pesananEdit?.items ?? []);
  const [metodeBayar, setMetodeBayar] = useState<"tunai" | "qris" | "edc" | null>(
    // Metode self-order (gopay/dana/VA) tidak ada di pilihan kasir,
    // jadi kalau pesanan berasal dari QR meja, kasir harus memilih ulang
    pesananEdit && ["tunai", "qris", "edc"].includes(pesananEdit.metodePembayaran)
      ? (pesananEdit.metodePembayaran as "tunai" | "qris" | "edc")
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ringkasanBerhasil, setRingkasanBerhasil] = useState<RingkasanPesanan | null>(null);

  const selectedMeja = mejaList.find((m) => m.idMeja === selectedMejaId) ?? null;

  function handleAddToCart(menu: Menu, jumlah: number) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.idMenu === menu.idMenu);
      if (existing) {
        return prev.map((item) =>
          item.idMenu === menu.idMenu ? { ...item, jumlah: item.jumlah + jumlah } : item
        );
      }
      return [...prev, { idMenu: menu.idMenu, namaMenu: menu.namaMenu, harga: menu.harga, gambarUrl: menu.gambarUrl, jumlah }];
    });
  }

  function handleUpdateQty(idMenu: number, jumlah: number) {
    setCartItems((prev) => {
      if (jumlah <= 0) {
        return prev.filter((item) => item.idMenu !== idMenu);
      }
      return prev.map((item) => (item.idMenu === idMenu ? { ...item, jumlah } : item));
    });
  }

  function handleClearCart() {
    setCartItems([]);
    setSelectedMejaId(null);
  }

  function handleConfirmPesanan() {
    setError("");

    if (jenisLayanan === "dine_in" && !selectedMejaId) {
      setError("Silakan pilih meja terlebih dahulu");
      return;
    }

    setStep("pembayaran");
  }

  async function handleConfirmPembayaran() {
    setError("");

    if (!metodeBayar) {
      setError("Silakan pilih metode pembayaran");
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
    const pajak = Math.round(subtotal * PAJAK_PERSEN);
    const diskon = 0;
    const total = subtotal + pajak - diskon;

    setIsSubmitting(true);

    const result = isEdit
      ? await updatePesananLengkap({
          idPesanan: pesananEdit.idPesanan,
          idMeja: jenisLayanan === "dine_in" ? selectedMejaId : null,
          jenisLayanan,
          cartItems,
          metodePembayaran: metodeBayar,
          total,
        })
      : await createPesananLengkap({
          idKaryawan,
          idMeja: jenisLayanan === "dine_in" ? selectedMejaId : null,
          jenisLayanan,
          cartItems,
          metodePembayaran: metodeBayar,
          subtotal,
          pajak,
          diskon,
          total,
        });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Gagal menyimpan pesanan");
      return;
    }

    setError("");

    // Simpan ringkasan dulu untuk ditampilkan di modal, sebelum cart di-reset
    setRingkasanBerhasil({
      jenisLayanan,
      selectedMeja,
      cartItems,
      metodeBayar,
      total,
      nomorAntrian: result.nomorAntrian ?? null,
    });

    setStep("pesanan");
  }

  function handleTutupModalBerhasil() {
    setRingkasanBerhasil(null);
    if (isEdit) {
      // Selesai mengedit — balik ke daftar pesanan
      router.push("/pesanan");
      return;
    }
    handleClearCart();
    setMetodeBayar(null);
  }

  return (
    <>
      <Header
        dashboardLabel="Kasir Dashboard"
        pageTitle={isEdit ? "Edit Pesanan" : "Pemesanan"}
      />

      {isEdit && (
        <div className="mx-8 mt-4 flex items-center justify-between rounded-lg border border-[#2d5a4a] bg-[#fdf8f0] px-5 py-3">
          <p className="text-sm">
            Sedang mengedit <span className="font-bold">pesanan #{pesananEdit.idPesanan}</span>
            {pesananEdit.idMeja === null && " (Take Away)"} — perubahan baru tersimpan setelah
            konfirmasi pembayaran.
          </p>
          <button
            onClick={() => router.push("/pesanan")}
            className="text-sm font-semibold text-[#2d5a4a] underline shrink-0 ml-4"
          >
            Batal Edit
          </button>
        </div>
      )}

      <div className="flex-1 flex h-[calc(100vh-96px)] overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="font-bold text-lg shrink-0">Menu</h2>
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari menu..."
                className="w-full bg-[#fdf8f0] border border-black/10 rounded-full pl-4 pr-11 py-2.5 outline-none"
              />
              <Image
                src="/icons/selforder/search.png"
                alt="Cari"
                width={20}
                height={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          <div className="mb-5">
            <CategoryTabs active={kategori} onChange={setKategori} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {menuListActive.map((menu) => (
              <MenuCard
                key={menu.idMenu}
                menu={menu}
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateQty={handleUpdateQty}
              />
            ))}
          </div>
          {menuListActive.length === 0 && (
            <p className="text-center text-black/40 mt-12">Menu tidak ditemukan</p>
          )}
        </main>

        <CartPanel
          step={step}
          jenisLayanan={jenisLayanan}
          onChangeJenisLayanan={(val) => {
            setJenisLayanan(val);
            if (val === "take_away") setSelectedMejaId(null);
          }}
          selectedMeja={selectedMeja}
          onOpenTableModal={() => setIsTableModalOpen(true)}
          cartItems={cartItems}
          onUpdateQty={handleUpdateQty}
          onClearCart={handleClearCart}
          onConfirmPesanan={handleConfirmPesanan}
          onBackToPesanan={() => setStep("pesanan")}
          metodeBayar={metodeBayar}
          onSelectMetodeBayar={setMetodeBayar}
          onConfirmPembayaran={handleConfirmPembayaran}
          error={error}
          isEdit={isEdit}
          totalDibayar={pesananEdit?.totalLama}
        />
      </div>

      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        meja={mejaList}
        selectedMejaId={selectedMejaId}
        onSelect={setSelectedMejaId}
      />

      <PesananBerhasilModal
        isOpen={ringkasanBerhasil !== null}
        onClose={handleTutupModalBerhasil}
        jenisLayanan={ringkasanBerhasil?.jenisLayanan ?? "dine_in"}
        selectedMeja={ringkasanBerhasil?.selectedMeja ?? null}
        cartItems={ringkasanBerhasil?.cartItems ?? []}
        metodeBayar={ringkasanBerhasil?.metodeBayar ?? null}
        total={ringkasanBerhasil?.total ?? 0}
        nomorAntrian={ringkasanBerhasil?.nomorAntrian}
      />

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl px-8 py-6 font-semibold">Memproses pesanan...</div>
        </div>
      )}
    </>
  );
}