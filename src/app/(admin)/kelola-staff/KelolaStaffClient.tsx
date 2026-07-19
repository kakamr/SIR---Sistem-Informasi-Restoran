"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import {
  getKaryawanList,
  createKaryawan,
  updateKaryawan,
  deleteKaryawan,
  type KaryawanListItem,
} from "@/lib/actions/karyawan";
import StaffFormModal from "@/components/admin/StaffFormModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";

const ROLE_LABEL: Record<string, string> = {
  kasir: "Kasir",
  koki: "Koki",
  pelayan: "Pelayan",
  admin: "Admin",
};

export default function KelolaStaffClient({ initialStaff }: { initialStaff: KaryawanListItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<KaryawanListItem | undefined>(undefined);
  const [staffToDelete, setStaffToDelete] = useState<KaryawanListItem | null>(null);

  const { data } = usePolling(getKaryawanList, 10000, !isModalOpen && !staffToDelete);
  const staffList = data ?? initialStaff;

  function handleOpenCreate() {
    setEditingStaff(undefined);
    setIsModalOpen(true);
  }

  function handleOpenEdit(staff: KaryawanListItem) {
    setEditingStaff(staff);
    setIsModalOpen(true);
  }

  async function handleSubmit(formData: {
    namaKaryawan: string;
    role: "kasir" | "koki" | "pelayan" | "admin";
    username: string;
    password: string;
    noTelepon?: string;
  }) {
    if (editingStaff) {
      const result = await updateKaryawan(editingStaff.idKaryawan, formData);
      if (!result.success) alert(result.message);
    } else {
      const result = await createKaryawan(formData);
      if (!result.success) alert(result.message);
    }
  }

  async function handleConfirmDelete() {
    if (!staffToDelete) return;

    const result = await deleteKaryawan(staffToDelete.idKaryawan);
    if (!result.success) {
      alert(result.message);
    }
    setStaffToDelete(null);
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleOpenCreate}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg"
        >
          Tambah Akun Staff
        </button>
      </div>

      <div className="bg-[#fdf8f0] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#2d5a4a] text-white">
            <tr>
              <th className="px-5 py-3 text-sm font-semibold">Nama</th>
              <th className="px-5 py-3 text-sm font-semibold">Role</th>
              <th className="px-5 py-3 text-sm font-semibold">Username</th>
              <th className="px-5 py-3 text-sm font-semibold">No. Telepon</th>
              <th className="px-5 py-3 text-sm font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff) => (
              <tr key={staff.idKaryawan} className="border-b border-black/10 last:border-none">
                <td className="px-5 py-3">{staff.namaKaryawan}</td>
                <td className="px-5 py-3">{ROLE_LABEL[staff.role]}</td>
                <td className="px-5 py-3">{staff.username}</td>
                <td className="px-5 py-3">{staff.noTelepon ?? "-"}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="text-[#2d5a4a] font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setStaffToDelete(staff)}
                      className="text-red-500 font-semibold text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {staffList.length === 0 && (
          <p className="text-center text-black/40 py-8">Belum ada staff</p>
        )}
      </div>

      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={editingStaff ? "edit" : "create"}
        initialData={editingStaff}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        isOpen={staffToDelete !== null}
        title="Hapus Akun Staff"
        description={
          staffToDelete
            ? `Apakah Anda yakin ingin menghapus akun "${staffToDelete.namaKaryawan}" (${staffToDelete.username})?`
            : ""
        }
        warningText="Akun yang sudah dihapus tidak bisa dikembalikan."
        onClose={() => setStaffToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </main>
  );
}