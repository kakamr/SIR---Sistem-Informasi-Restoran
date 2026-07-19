"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import QuantityUnitModal from "./QuantityUnitModal";
import TagInput from "@/components/shared/TagInput";
import { uploadGambarMenu, deleteGambarLama } from "@/lib/actions/upload";
import type { Menu, BahanBaku, ResepItem } from "@/lib/types";

interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: Menu;
  availableBahan: BahanBaku[];
  onSubmit: (data: Omit<Menu, "idMenu" | "statusMenu">) => void;
}

export default function MenuFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  availableBahan,
  onSubmit,
}: MenuFormModalProps) {
  const [namaMenu, setNamaMenu] = useState("");
  const [kategori, setKategori] = useState("");
  const [harga, setHarga] = useState(0);
  const [bahan, setBahan] = useState<ResepItem[]>([]);
  const [instruksiMasak, setInstruksiMasak] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);
  const [gambarUrlLama, setGambarUrlLama] = useState<string | undefined>(undefined);
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNamaMenu(initialData?.namaMenu ?? "");
      setKategori(initialData?.kategori ?? "");
      setHarga(initialData?.harga ?? 0);
      setBahan(initialData?.bahan ?? []);
      setInstruksiMasak(initialData?.instruksiMasak ?? "");
      setDeskripsi(initialData?.deskripsi ?? "");
      setGambarFile(null);
      setGambarPreview(initialData?.gambarUrl ?? null);
      setGambarUrlLama(initialData?.gambarUrl);
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    setError("");
    if (file.size > MAX_SIZE) {
      setError(`Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal 2MB.`);
      e.target.value = ""; // reset input supaya file yang sama bisa dipilih ulang setelah dikompres
      return;
    }

    setGambarFile(file);
    setGambarPreview(URL.createObjectURL(file));
  }

  function handleAddBahan(idBahan: number, namaBahan: string, jumlah: number, satuan: string) {
    setBahan((prev) => {
      const existingIndex = prev.findIndex((b) => b.idBahan === idBahan);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { idBahan, namaBahan, jumlahDibutuhkan: jumlah, satuan };
        return updated;
      }
      return [...prev, { idBahan, namaBahan, jumlahDibutuhkan: jumlah, satuan }];
    });
  }

  function handleRemoveBahan(index: number) {
    setBahan((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    setError("");

    if (!namaMenu.trim() || !kategori.trim() || harga <= 0) {
      setError("Nama, kategori, dan harga menu wajib diisi");
      return;
    }

    let gambarUrl = gambarUrlLama;

    // Upload gambar baru kalau user pilih file baru
    if (gambarFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("gambar", gambarFile);

      const uploadResult = await uploadGambarMenu(formData);
      setIsUploading(false);

      if (!uploadResult.success) {
        setError(uploadResult.message ?? "Gagal upload gambar");
        return;
      }

      // Hapus gambar lama dari disk kalau ini mode edit dan sebelumnya sudah ada gambar
      if (mode === "edit" && gambarUrlLama) {
        deleteGambarLama(gambarUrlLama);
      }

      gambarUrl = uploadResult.url;
    }

    onSubmit({
      namaMenu,
      kategori,
      harga,
      bahan,
      instruksiMasak,
      deskripsi,
      gambarUrl,
    });
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-6"
        onClick={onClose}
      >
        <div
          className="min-h-full flex items-start justify-center py-8"
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-lg my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">
              {mode === "create" ? "Tambah Menu" : "Edit Menu"}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Nama</label>
                <input
                  type="text"
                  value={namaMenu}
                  onChange={(e) => setNamaMenu(e.target.value)}
                  placeholder="Masukan Nama"
                  className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Cemilan">Cemilan</option>
                  <option value="Paket">Paket</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Harga</label>
                <input
                  type="number"
                  value={harga}
                  onChange={(e) => setHarga(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Bahan</label>
                <TagInput
                  tags={bahan}
                  onRemove={handleRemoveBahan}
                  onAddClick={() => setIsQtyModalOpen(true)}
                  renderLabel={(b) => `${b.namaBahan} - ${b.jumlahDibutuhkan}${b.satuan}`}
                  placeholder="Tambahkan Tag Bahan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Resep (Instruksi)</label>
                <textarea
                  value={instruksiMasak}
                  onChange={(e) => setInstruksiMasak(e.target.value)}
                  placeholder="Masukan Resep"
                  rows={4}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Deskripsi</label>
                <textarea
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Masukan Deskripsi"
                  rows={4}
                  className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Gambar</label>
                <label className="flex items-center gap-3 border border-black/20 rounded-lg px-4 py-3 cursor-pointer w-fit">
                  {gambarPreview ? (
                    <Image
                      src={gambarPreview}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="object-cover rounded"
                    />
                  ) : (
                    <span className="w-10 h-10 bg-gray-200 rounded" />
                  )}
                  <span>{gambarFile ? gambarFile.name : "Upload Gambar"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-black/40 mt-1">Format JPG/PNG/WebP, maksimal 2MB</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-4 mt-2 disabled:opacity-50"
              >
                {isUploading ? "Mengupload gambar..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuantityUnitModal
        isOpen={isQtyModalOpen}
        onClose={() => setIsQtyModalOpen(false)}
        availableBahan={availableBahan}
        onSubmit={handleAddBahan}
      />
    </>
  );
}