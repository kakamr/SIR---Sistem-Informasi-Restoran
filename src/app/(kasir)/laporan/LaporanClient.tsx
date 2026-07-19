// src/app/(kasir)/laporan/LaporanClient.tsx
"use client";

import { usePolling } from "@/lib/hooks/usePolling";
import SummaryCard from "@/components/shared/SummaryCard";
import RevenueChart from "@/components/kasir/RevenueChart";
import StatusBadge from "@/components/shared/StatusBadge";
import LaporanActionsClient from "./LaporanActionsClient";
import { formatRupiah, formatTanggal } from "@/lib/utils/formatCurrency";
import { getLaporanSummary } from "@/lib/actions/laporan";
import type { LaporanSummary } from "@/lib/types";

export default function LaporanClient({ initialSummary }: { initialSummary: LaporanSummary }) {
  const { data } = usePolling(getLaporanSummary, 45000); // data agregat, tidak perlu sering-sering
  const summary = data ?? initialSummary;

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="grid grid-cols-4 gap-5 mb-6">
        <SummaryCard label="Menu Tersedia" value={summary.menuTersedia} icon="/icons/laporan/menu.png"/>
        <SummaryCard label="Total Pesanan" value={summary.totalPesanan} icon="/icons/laporan/total_pesanan.png"/>
        <SummaryCard label="Total Sale" value={formatRupiah(summary.totalSale)} icon="/icons/laporan/total_sale.png"/>
        <SummaryCard label="Menu Terlaris" value={summary.menuTerlaris} icon="/icons/laporan/Menu Terlaris.png"/>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="col-span-2 bg-[#fdf8f0] rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Total Revenue</h3>
          <RevenueChart data={summary.revenueByMonth} />
        </div>

        <div className="bg-[#fdf8f0] rounded-xl p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-6">Customer</h3>
          <div className="flex items-baseline justify-center gap-4 mb-6">
            <span className="text-5xl font-bold">{summary.customerOnline}</span>
            <span className="text-black/30 text-2xl">|</span>
            <span className="text-5xl font-bold">{summary.customerOnShop}</span>
          </div>
          <div className="flex justify-center gap-8 text-sm text-black/60 mb-4">
            <span>Online</span>
            <span>On-Shop</span>
          </div>
          <div
            className="h-10 rounded-lg overflow-hidden grid"
            style={{
              gridTemplateColumns: `${summary.customerOnline}fr ${summary.customerOnShop}fr`,
            }}
          >
            <div className="bg-[#2d5a4a] h-full" />
            <div className="bg-[#7ba88f] h-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <LaporanActionsClient />

        <div className="bg-[#fdf8f0] rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Transaksi Hari Ini</h3>
          <div className="grid grid-cols-4 gap-3">
            <TransaksiStat value={summary.transaksiHariIni.orderHariIni} label="Order Hari Ini" />
            <TransaksiStat value={summary.transaksiHariIni.selesai} label="Selesai" />
            <TransaksiStat value={summary.transaksiHariIni.diproses} label="Diproses" />
            <TransaksiStat value={summary.transaksiHariIni.batal} label="Batal" />
          </div>
        </div>

        <div className="bg-[#fdf8f0] rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Pesanan Terbaru</h3>
          <div className="flex flex-col gap-3 max-h-[100px] overflow-y-auto pr-2">
            {summary.pesananTerbaru.map((p) => (
              <div key={p.idPesanan} className="bg-[#2d5a4a] text-white rounded-lg p-4 flex items-center gap-3">
                <span className="w-10 h-10 bg-white/20 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">Pesanan #{p.idPesanan}</p>
                  <p className="text-xs text-white/70">{formatTanggal(p.waktuPesan)}</p>
                  <p className="font-bold mt-1">{formatRupiah(p.totalTagihan)}</p>
                </div>
                <StatusBadge status={p.statusPesanan} />
              </div>
            ))}
            {summary.pesananTerbaru.length === 0 && (
              <p className="text-black/40 text-sm text-center py-4">Belum ada pesanan</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function TransaksiStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-[#2d5a4a] text-white rounded-lg p-4 flex flex-col items-center">
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-xs text-center mt-1">{label}</span>
    </div>
  );
}