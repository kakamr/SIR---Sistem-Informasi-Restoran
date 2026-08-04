"use client";

import { useState, useEffect } from "react";
import type { RoleKaryawan } from "@/lib/types";
import type { KaryawanListItem } from "@/lib/actions/karyawan";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: KaryawanListItem;
  onSubmit: (data: {
    namaKaryawan: string;
    role: RoleKaryawan;
    username: string;
    password: string;
    noTelepon?: string;
  }) => void;
}

export default function StaffFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
}: StaffFormModalProps) {
  const [namaKaryawan, setNamaKaryawan] = useState("");
  const [role, setRole] = useState<RoleKaryawan>("kasir");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [noTelepon, setNoTelepon] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNamaKaryawan(initialData?.namaKaryawan ?? "");
      setRole(initialData?.role ?? "kasir");
      setUsername(initialData?.username ?? "");
      setPassword("");
      setNoTelepon(initialData?.noTelepon ?? "");
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  function handleSubmit() {
    setError("");

    if (!namaKaryawan.trim() || !username.trim()) {
      setError("Nama dan username wajib diisi");
      return;
    }

    if (mode === "create" && password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (mode === "edit" && password.length > 0 && password.length < 6) {
      setError("Password minimal 6 karakter, atau kosongkan jika tidak ingin mengubah password");
      return;
    }

    onSubmit({ namaKaryawan, role, username, password, noTelepon: noTelepon || undefined });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">
          {mode === "create" ? "Tambah Akun Staff" : "Edit Akun Staff"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <label className="block text-sm font-semibold mb-2">Nama</label>
        <input
          type="text"
          value={namaKaryawan}
          onChange={(e) => setNamaKaryawan(e.target.value)}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        />

        <label className="block text-sm font-semibold mb-2">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as RoleKaryawan)}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        >
          <option value="kasir">Kasir</option>
          <option value="koki">Koki</option>
          <option value="pelayan">Pelayan</option>
          <option value="admin">Admin</option>
        </select>

        <label className="block text-sm font-semibold mb-2">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        />

        <label className="block text-sm font-semibold mb-2">
          Password{" "}
          {mode === "edit" && (
            <span className="font-normal text-black/40">(kosongkan jika tidak diubah)</span>
          )}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "create" ? "Minimal 6 karakter" : "••••••"}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-4 outline-none"
        />

        <label className="block text-sm font-semibold mb-2">No. Telepon (opsional)</label>
        <input
          type="text"
          value={noTelepon}
          onChange={(e) => setNoTelepon(e.target.value)}
          className="w-full border border-black/20 rounded-lg px-4 py-3 mb-6 outline-none"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3"
        >
          Simpan
        </button>
      </div>
    </div>
  );
}