import { getMejaByKodeAkses } from "@/lib/actions/meja";
import { notFound } from "next/navigation";
import PesananClient from "./PesananClient";

export default async function PesananPage({
  params,
}: {
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;
  const meja = await getMejaByKodeAkses(kodeAkses);

  if (!meja) notFound();

  return <PesananClient nomorMeja={meja.nomorMeja} kodeAkses={kodeAkses} />;
}