import Header from "@/components/layout/Header";
import { getBahanList } from "@/lib/actions/bahan";
import StokClient from "./StokClient";

export default async function StokPage() {
  const bahanList = await getBahanList();

  return (
    <>
      <Header dashboardLabel="Koki Dashboard" pageTitle="Stok" />
      <StokClient initialBahanList={bahanList} />
    </>
  );
}