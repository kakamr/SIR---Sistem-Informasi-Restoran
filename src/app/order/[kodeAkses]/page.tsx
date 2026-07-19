import { getMenuList } from "@/lib/actions/menu";
import { getMejaByKodeAkses } from "@/lib/actions/meja";
import MenuSelfOrderClient from "./MenuSelfOrderClient";
import { notFound } from "next/navigation";

export default async function OrderMenuPage({
  params,
}: {
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;
  const [menuList, meja] = await Promise.all([
    getMenuList(),
    getMejaByKodeAkses(kodeAkses),
  ]);

  if (!meja) notFound();

  return (
    <MenuSelfOrderClient
      menuList={menuList.filter((m) => m.statusMenu === "aktif")}
      nomorMeja={meja.nomorMeja}
      idMeja={meja.idMeja.toString()} // tetap kirim idMeja asli untuk dipakai internal (cart, dsb)
      kodeAkses={kodeAkses}
    />
  );
}