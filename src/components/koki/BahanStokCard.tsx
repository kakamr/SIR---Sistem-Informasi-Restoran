import StatusBadge from "@/components/shared/StatusBadge";
import type { BahanBaku } from "@/lib/types";
import Image from "next/image";

interface BahanStokCardProps {
  bahan: BahanBaku;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BahanStokCard({ bahan, onEdit, onDelete }: BahanStokCardProps) {
  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5 flex flex-col">
      {bahan.gambarUrl ? (
        <Image
          src={bahan.gambarUrl}
          alt={bahan.namaBahan}
          className="w-full aspect-square object-cover rounded-lg mb-4"
          width={200}
          height={200}
        />
      ) : (
        <div className="w-full aspect-square bg-gray-300 rounded-lg mb-4" />
      )}

      <h3 className="font-semibold text-lg leading-tight">{bahan.namaBahan}</h3>

      <div className="flex items-center justify-between mt-2 mb-4">
        <span className="text-xl font-bold">
          {bahan.stokTersedia} {bahan.satuan}
        </span>
        <StatusBadge status={bahan.statusStok} />
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={onEdit}
          className="flex-1 bg-[#2d5a4a] text-white font-semibold rounded-lg py-2.5"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="w-11 h-11 shrink-0 border border-black/20 rounded-lg flex items-center justify-center hover:bg-black/5"
          aria-label="Hapus"
        >
          <Image src="/icons/button/delete.png" alt="hapus bahan" width={20} height={20}/>
        </button>
      </div>
    </div>
  );
}