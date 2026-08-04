"use client";

const KATEGORI_LIST = ["All", "Makanan", "Minuman", "Cemilan", "Paket"];

interface CategoryTabsProps {
  active: string;
  onChange: (kategori: string) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {KATEGORI_LIST.map((kategori) => (
        <button
          key={kategori}
          onClick={() => onChange(kategori)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            active === kategori
              ? "bg-[#2d5a4a] text-white border-[#2d5a4a]"
              : "bg-[#fdf8f0] text-black/70 border-black/10"
          }`}
        >
          {kategori}
        </button>
      ))}
    </div>
  );
}