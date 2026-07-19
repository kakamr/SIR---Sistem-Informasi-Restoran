import Header from "@/components/layout/Header";
import { getPesananSiapSaji } from "@/lib/actions/pesanan";
import PenyajianClient from "./PenyajianClient";

export default async function PenyajianPage() {
  const pesananList = await getPesananSiapSaji();
  const siapSaji = pesananList.filter((p) => p.statusPesanan === "disajikan");

  return (
    <>
      <Header dashboardLabel="Pelayan Dashboard" pageTitle="Penyajian" />
      <PenyajianClient initialPesanan={siapSaji} />
    </>
  );
}