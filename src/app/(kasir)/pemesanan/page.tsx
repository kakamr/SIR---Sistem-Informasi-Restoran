import { getMenuList } from "@/lib/actions/menu";
import { getMejaList } from "@/lib/actions/meja";
import { getSession } from "@/lib/actions/auth";
import PemesananClient from "./PemesananClient";

export default async function PemesananPage() {
  const [menuList, mejaList, session] = await Promise.all([
    getMenuList(),
    getMejaList(),
    getSession(),
  ]);

  return (
    <PemesananClient
      menuList={menuList.filter((m) => m.statusMenu === "aktif")}
      mejaList={mejaList}
      idKaryawan={session?.idKaryawan ?? 0}
    />
  );
}