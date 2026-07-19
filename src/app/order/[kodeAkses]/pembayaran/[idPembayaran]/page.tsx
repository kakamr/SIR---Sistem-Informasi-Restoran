import { getPembayaranStatus } from "@/lib/actions/pesanan-selforder";
import { notFound, redirect } from "next/navigation";
import MenungguPembayaranClient from "./MenungguPembayaranClient";

export default async function PembayaranPage({
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

  if (pembayaran.status_pembayaran === "berhasil") {
    redirect(
      `/order/${kodeAkses}/pembayaran/${idPembayaran}/berhasil`
    );
  }

  return (
    <MenungguPembayaranClient
      initialData={pembayaran}
    />
  );
}