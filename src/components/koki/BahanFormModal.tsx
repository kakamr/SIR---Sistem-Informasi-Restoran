"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import TagInput from "@/components/shared/TagInput";
import { uploadGambarBahan, deleteGambarLama } from "@/lib/actions/upload";
import type { BahanBaku } from "@/lib/types";

const SATUAN_OPTIONS = ["Kg", "gram", "liter", "ml", "butir", "pcs", "ikat"];

interface BahanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: BahanBaku;
  onSubmit: (data: Omit<BahanBaku, "idBahan" | "statusStok">) => void;
}

export default function BahanFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
}: BahanFormModalProps) {
  const [namaBahan, setNamaBahan] = useState("");
  const [stokTersedia, setStokTersedia] = useState(0);
  const [batasMinimum, setBatasMinimum] = useState(0);
  const [selectedSatuan, setSelectedSatuan] = useState<string[]>([]);
  const [isSatuanPickerOpen, setIsSatuanPickerOpen] = useState(false);
  const [gambarFile, setGambarFile] = useState<File | null>(null);
  const [gambarPreview, setGambarPreview] = useState<string | null>(null);
  const [gambarUrlLama, setGambarUrlLama] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNamaBahan(initialData?.namaBahan ?? "");
      setStokTersedia(initialData?.stokTersedia ?? 0);
      setBatasMinimum(initialData?.batasMinimum ?? 0);
      setSelectedSatuan(initialData?.satuan ? [initialData.satuan] : []);
      setGambarFile(null);
      setGambarPreview(initialData?.gambarUrl ?? null);
      setGambarUrlLama(initialData?.gambarUrl);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setGambarFile(file);
    if (file) {
      setGambarPreview(URL.createObjectURL(file));
    }
  }

  function handleRemoveSatuan(index: number) {
    setSelectedSatuan((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePickSatuan(satuan: string) {
    // Satuan cuma boleh 1 (bukan multi seperti Bahan di Menu)
    setSelectedSatuan([satuan]);
    setIsSatuanPickerOpen(false);
  }

  async function handleSubmit() {
    if (!namaBahan.trim() || stokTersedia < 0 || selectedSatuan.length === 0) {
      alert("Nama, kuantitas, dan satuan wajib diisi");
      return;
    }

    let gambarUrl = gambarUrlLama;

    if (gambarFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("gambar", gambarFile);

      const uploadResult = await uploadGambarBahan(formData);
      setIsUploading(false);

      if (!uploadResult.success) {
        alert(uploadResult.message ?? "Gagal upload gambar");
        return;
      }

      if (mode === "edit" && gambarUrlLama) {
        deleteGambarLama(gambarUrlLama);
      }

      gambarUrl = uploadResult.url;
    }

    onSubmit({
      namaBahan,
      satuan: selectedSatuan[0],
      stokTersedia,
      batasMinimum,
      gambarUrl,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-lg my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">
          {mode === "create" ? "Tambah Bahan" : "Edit Bahan"}
        </h2>

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Nama</label>
            <input
              type="text"
              value={namaBahan}
              onChange={(e) => setNamaBahan(e.target.value)}
              placeholder="Masukan Nama"
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Kuantitas/Berat
            </label>
            <input
              type="number"
              value={stokTersedia}
              onChange={(e) => setStokTersedia(Number(e.target.value))}
              placeholder="0"
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Satuan Kuantitas/Berat
            </label>
            <TagInput
              tags={selectedSatuan}
              onRemove={handleRemoveSatuan}
              onAddClick={() => setIsSatuanPickerOpen(true)}
              renderLabel={(s) => s}
              placeholder="Tambahkan Tag Satuan Kuantitas/Berat"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Batas Minimum Stok
            </label>
            <input
              type="number"
              value={batasMinimum}
              onChange={(e) => setBatasMinimum(Number(e.target.value))}
              placeholder="0"
              className="w-full border border-black/20 rounded-lg px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Gambar</label>
            <label className="flex items-center gap-3 border border-black/20 rounded-lg px-4 py-3 cursor-pointer w-fit">
              {gambarPreview ? (
                <Image
                  src={gambarPreview}
                  alt="Preview"
                  width={40}
                  height={40}
                  className="object-cover rounded w-10 h-10"
                  unoptimized={gambarPreview.startsWith("blob:")}
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

      {/* Mini picker satuan */}
      {isSatuanPickerOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]"
          onClick={() => setIsSatuanPickerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-4">Pilih Satuan</h3>
            <div className="flex flex-wrap gap-2">
              {SATUAN_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handlePickSatuan(s)}
                  className="border border-black/30 rounded-full px-4 py-2 text-sm hover:bg-[#2d5a4a] hover:text-white hover:border-[#2d5a4a] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}