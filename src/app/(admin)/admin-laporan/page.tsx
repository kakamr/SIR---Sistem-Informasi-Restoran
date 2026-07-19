import Header from "@/components/layout/Header";
import { getLaporanSummary } from "@/lib/actions/laporan";
import LaporanClient from "@/app/(kasir)/laporan/LaporanClient";

export default async function LaporanAdminPage() {
  const initialSummary = await getLaporanSummary();
  return (
    <>
      <Header dashboardLabel="Admin Dashboard" pageTitle="Laporan" />
      <LaporanClient initialSummary={initialSummary} />
    </>
  );
}