import { getMejaByKodeAkses } from "@/lib/actions/meja";
import { notFound } from "next/navigation";
import MetodePembayaranClient from "./MetodePembayaranClient";

export default async function MetodePembayaranPage({
  params,
}: {
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;
  const meja = await getMejaByKodeAkses(kodeAkses);

  if (!meja) notFound();

  return (
    <MetodePembayaranClient
      idMeja={meja.idMeja}
      nomorMeja={meja.nomorMeja}
      kodeAkses={kodeAkses}
    />
  );
}