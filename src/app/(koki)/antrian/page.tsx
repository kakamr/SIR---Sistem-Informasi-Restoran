import Header from "@/components/layout/Header";
import { getAntrianDapur } from "@/lib/actions/tiket";
import AntrianClient from "./AntrianClient";

export default async function AntrianPage() {
  const antrian = await getAntrianDapur();

  return (
    <>
      <Header dashboardLabel="Koki Dashboard" pageTitle="Antrian" />
      <AntrianClient initialAntrian={antrian} />
    </>
  );
}