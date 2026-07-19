import Header from "@/components/layout/Header";
import { getLaporanSummary } from "@/lib/actions/laporan";
import LaporanClient from "./LaporanClient";

export default async function LaporanPage() {
  const initialSummary = await getLaporanSummary();
  return (
    <>
      <Header dashboardLabel="Kasir Dashboard" pageTitle="Laporan" />
      <LaporanClient initialSummary={initialSummary} />
    </>
  );
}