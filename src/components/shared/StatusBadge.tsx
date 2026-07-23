import type { StatusPesanan, StatusTiket, StatusMenu, StatusStok } from "@/lib/types";

type AnyStatus = StatusPesanan | StatusTiket | StatusMenu | StatusStok | string;

interface StatusBadgeProps {
  status: AnyStatus;
}

const STATUS_LABEL: Record<string, string> = {
  menunggu_bayar: "Menunggu Bayar",
  diproses: "Diproses",
  siap_disajikan: "Siap Disajikan",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  menunggu: "Menunggu",
  aktif: "Tersedia",
  nonaktif: "Nonaktif",
  aman: "Aman",
  menipis: "Menipis",
  habis: "Habis",
  kosong: "Kosong",
  terisi: "Terisi",
};

const STATUS_COLOR: Record<string, string> = {
  menunggu_bayar: "bg-yellow-600",
  diproses: "bg-[#2d5a4a]",
  siap_disajikan: "bg-blue-600",
  selesai: "bg-gray-500",
  dibatalkan: "bg-red-600",
  menunggu: "bg-yellow-600",
  aktif: "bg-[#2d5a4a]",
  nonaktif: "bg-gray-400",
  aman: "bg-[#2d5a4a]",
  menipis: "bg-yellow-600",
  habis: "bg-red-600",
  kosong: "bg-gray-400",
  terisi: "bg-[#2d5a4a]",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABEL[status] ?? status;
  const color = STATUS_COLOR[status] ?? "bg-gray-500";

  return (
    <span
      className={`${color} text-white text-xs font-semibold px-3 py-1.5 rounded-full shrink-0`}
    >
      {label}
    </span>
  );
}