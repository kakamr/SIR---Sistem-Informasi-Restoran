import { formatRupiah } from "@/lib/utils/formatCurrency";
import StatusBadge from "./StatusBadge";
import type { DetailPesanan } from "@/lib/types";

interface OrderCardProps {
  title: string; 
  subtitle?: string; 
  itemCount?: number; 
  status?: string; 
  items: DetailPesanan[];
  total?: number;
  actionLabel?: string; 
  onAction?: () => void;
  secondaryActionLabel?: string; 
  onSecondaryAction?: () => void;
  extraAction?: React.ReactNode; 
}

export default function OrderCard({
  title,
  subtitle,
  itemCount,
  status,
  items,
  total,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  extraAction,
}: OrderCardProps) {
  return (
    <div className="bg-[#fdf8f0] rounded-xl p-5 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-bold text-lg">{title}</h3>
        {status && <StatusBadge status={status} />}
      </div>

      {subtitle && <p className="text-sm text-black/50 mb-1">{subtitle}</p>}
      {itemCount !== undefined && (
        <p className="text-sm font-semibold mb-3">{itemCount} item</p>
      )}

      <div className="flex flex-col gap-2 mb-3">
        {items.map((item) => (
          <div key={item.idDetail} className="text-sm">
            <div className="flex justify-between">
              <span className="text-black/80">
                {item.jumlah}x {item.namaMenu}
              </span>
              <span className="font-medium">{formatRupiah(item.subtotal)}</span>
            </div>
            {item.catatanItem && (
              <p className="text-xs text-[#2d5a4a] italic mt-0.5">
                Catatan: {item.catatanItem}
              </p>
            )}
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="border-t-2 border-black/80 pt-3 flex justify-between items-center mb-4">
          <span className="font-bold">Total</span>
          <span className="font-bold text-lg">{formatRupiah(total)}</span>
        </div>
      )}

      {(actionLabel || secondaryActionLabel || extraAction) && (
        <div className="mt-auto flex flex-col gap-2">
          {extraAction}
          {secondaryActionLabel && (
            <button
              onClick={onSecondaryAction}
              className="w-full border-2 border-[#2d5a4a] text-[#2d5a4a] font-semibold rounded-lg py-3"
            >
              {secondaryActionLabel}
            </button>
          )}
          {actionLabel && (
            <button
              onClick={onAction}
              className="w-full bg-[#2d5a4a] text-white font-semibold rounded-lg py-3"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}