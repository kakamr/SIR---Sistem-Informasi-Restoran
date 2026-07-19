import { formatRupiah } from "@/lib/utils/formatCurrency";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Menu } from "@/lib/types";
import Image from "next/image";

interface MenuManageCardProps {
  menu: Menu;
  onEdit: () => void;
  onResep: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export default function MenuManageCard({
  menu,
  onEdit,
  onResep,
  onDelete,
  onToggleStatus,
}: MenuManageCardProps) {
  const isAktif = menu.statusMenu === "aktif";

  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5 flex flex-col">
      {menu.gambarUrl ? (
        <Image
          src={menu.gambarUrl}
          alt={menu.namaMenu}
          className="w-full aspect-square object-cover rounded-lg mb-4"
          width={200}
          height={200}
        />
      ) : (
        <div className="w-full aspect-square bg-gray-300 rounded-lg mb-4" />
      )}

      <h3 className="font-semibold text-lg leading-tight">{menu.namaMenu}</h3>
      <p className="text-sm text-black/50 mt-1 line-clamp-1">{menu.deskripsi}</p>

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-xl font-bold">{formatRupiah(menu.harga)}</span>
        <StatusBadge status={menu.statusMenu} />
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 bg-[#2d5a4a] text-white font-semibold rounded-lg py-2.5 text-sm"
          >
            Edit
          </button>
          <button
            onClick={onResep}
            className="flex-1 bg-[#2d5a4a] text-white font-semibold rounded-lg py-2.5 text-sm"
          >
            Resep
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleStatus}
            className="flex-1 border border-[#2d5a4a] text-[#2d5a4a] font-semibold rounded-lg py-2.5 text-sm hover:bg-[#2d5a4a]/5"
          >
            {isAktif ? "Nonaktifkan" : "Aktifkan"}
          </button>
          <button
            onClick={onDelete}
            className="flex-1 border border-red-500 text-red-500 font-semibold rounded-lg py-2.5 text-sm hover:bg-red-50"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}