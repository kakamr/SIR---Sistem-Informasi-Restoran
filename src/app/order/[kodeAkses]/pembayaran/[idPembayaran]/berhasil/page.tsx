import { getPembayaranStatus } from "@/lib/actions/pesanan-selforder";
import { notFound, redirect } from "next/navigation";
import PembayaranBerhasilClient from "./PembayaranBerhasilClient";

export default async function BerhasilPage({
  params,
}: {
  params: Promise<{
    kodeAkses: string;
    idPembayaran: string;
  }>;
}) {
  const { kodeAkses, idPembayaran } = await params;

  const pembayaran = await getPembayaranStatus(Number(idPembayaran));

  if (!pembayaran) {
    notFound();
  }

  // kalau ternyata belum berhasil, balik lagi
  if (pembayaran.status_pembayaran !== "berhasil") {
    redirect(
      `/order/${kodeAkses}/pembayaran/${idPembayaran}`
    );
  }

  return (
    <PembayaranBerhasilClient
      data={pembayaran}
    />
  );
}