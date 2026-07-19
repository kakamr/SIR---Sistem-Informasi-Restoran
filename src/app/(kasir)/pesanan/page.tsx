// src/app/(kasir)/pesanan/page.tsx
import Header from "@/components/layout/Header";
import { getPesananList } from "@/lib/actions/pesanan";
import PesananClient from "./PesananClient";

export default async function PesananPage() {
  const initialPesanan = await getPesananList();
  return (
    <>
      <Header dashboardLabel="Kasir Dashboard" pageTitle="Pesanan" />
      <PesananClient initialPesanan={initialPesanan} />
    </>
  );
}