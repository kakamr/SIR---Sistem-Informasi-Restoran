import Header from "@/components/layout/Header";
import { getMejaList } from "@/lib/actions/meja";
import KelolaMejaClient from "./KelolaMejaClient";

export default async function KelolaMejaPage() {
  const initialMeja = await getMejaList();

  return (
    <>
      <Header dashboardLabel="Admin Dashboard" pageTitle="Kelola Meja" />
      <KelolaMejaClient initialMeja={initialMeja} />
    </>
  );
}