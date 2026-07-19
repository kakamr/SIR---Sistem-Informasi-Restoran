"use client";

import { useState } from "react";
import { usePolling } from "@/lib/hooks/usePolling";
import MenuManageCard from "@/components/koki/MenuManageCard";
import MenuFormModal from "@/components/koki/MenuFormModal";
import InstruksiModal from "@/components/koki/InstruksiModal";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import { createMenu, updateMenu, deleteMenu, toggleStatusMenu, getMenuList } from "@/lib/actions/menu";
import type { Menu, BahanBaku } from "@/lib/types";

export default function MenuClient({
  initialMenuList,
  bahanList,
}: {
  initialMenuList: Menu[];
  bahanList: BahanBaku[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [resepMenu, setResepMenu] = useState<Menu | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);

  const { data } = usePolling(getMenuList, 3000, !isModalOpen && !menuToDelete);
  const menuList = data ?? initialMenuList;

  function handleOpenCreate() {
    setEditingMenu(undefined);
    setIsModalOpen(true);
  }

  function handleOpenEdit(menu: Menu) {
    setEditingMenu(menu);
    setIsModalOpen(true);
  }

  async function handleSubmitMenu(data: Omit<Menu, "idMenu" | "statusMenu">) {
    setIsSaving(true);

    if (editingMenu) {
      const result = await updateMenu(editingMenu.idMenu, {
        namaMenu: data.namaMenu,
        kategori: data.kategori,
        harga: data.harga,
        deskripsi: data.deskripsi,
        instruksiMasak: data.instruksiMasak,
        gambarUrl: data.gambarUrl,
        bahan: data.bahan ?? [],
      });
      if (!result.success) alert(result.message);
    } else {
      const result = await createMenu({
        namaMenu: data.namaMenu,
        kategori: data.kategori,
        harga: data.harga,
        deskripsi: data.deskripsi,
        instruksiMasak: data.instruksiMasak,
        gambarUrl: data.gambarUrl,
        bahan: data.bahan ?? [],
      });
      if (!result.success) alert(result.message);
    }

    setIsSaving(false);
  }

  async function handleToggleStatus(menu: Menu) {
    const statusBaru = menu.statusMenu === "aktif" ? "nonaktif" : "aktif";
    const result = await toggleStatusMenu(menu.idMenu, statusBaru);
    if (!result.success) alert(result.message);
  }

  async function handleConfirmDelete() {
    if (!menuToDelete) return;

    const result = await deleteMenu(menuToDelete.idMenu);
    if (!result.success) {
      alert(result.message);
    }
    setMenuToDelete(null);
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleOpenCreate}
          className="bg-[#2d5a4a] text-white font-semibold px-6 py-3 rounded-lg"
        >
          Tambah Menu
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {menuList.map((menu) => (
          <MenuManageCard
            key={menu.idMenu}
            menu={menu}
            onEdit={() => handleOpenEdit(menu)}
            onResep={() => setResepMenu(menu)}
            onDelete={() => setMenuToDelete(menu)}
            onToggleStatus={() => handleToggleStatus(menu)}
          />
        ))}
      </div>

      {menuList.length === 0 && (
        <p className="text-center text-black/40 mt-12">Belum ada menu</p>
      )}

      <MenuFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={editingMenu ? "edit" : "create"}
        initialData={editingMenu}
        availableBahan={bahanList}
        onSubmit={handleSubmitMenu}
      />

      <InstruksiModal
        isOpen={resepMenu !== null}
        namaMenu={resepMenu?.namaMenu ?? ""}
        instruksiMasak={resepMenu?.instruksiMasak}
        onClose={() => setResepMenu(null)}
      />

      <ConfirmDeleteModal
        isOpen={menuToDelete !== null}
        title="Hapus Menu"
        description={menuToDelete ? `Apakah Anda yakin ingin menghapus "${menuToDelete.namaMenu}"?` : ""}
        warningText="Menu yang pernah dipesan tidak bisa dihapus, gunakan Nonaktifkan sebagai gantinya."
        onClose={() => setMenuToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {isSaving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl px-8 py-6 font-semibold">Menyimpan...</div>
        </div>
      )}
    </main>
  );
}