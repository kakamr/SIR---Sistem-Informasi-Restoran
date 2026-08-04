import { getMejaByKodeAkses } from "@/lib/actions/meja";
import { notFound } from "next/navigation";
import DataDiriClient from "./DataDiriClient";

export default async function DataDiriPage({
  params,
}: {
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;
  const meja = await getMejaByKodeAkses(kodeAkses);

  if (!meja) notFound();

  return <DataDiriClient nomorMeja={meja.nomorMeja} kodeAkses={kodeAkses} />;
}