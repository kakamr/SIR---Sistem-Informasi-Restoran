import Header from "@/components/layout/Header";
import { getMejaList } from "@/lib/actions/meja";
import MejaClient from "./MejaClient";

export default async function MejaPage() {
  const mejaList = await getMejaList();

  return (
    <>
      <Header
        dashboardLabel="Pelayan Dashboard"
        pageTitle="Manajemen Meja"
      />

      <MejaClient initialMeja={mejaList} />
    </>
  );
}