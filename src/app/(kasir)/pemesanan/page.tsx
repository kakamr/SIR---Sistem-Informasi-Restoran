import { getMenuList } from "@/lib/actions/menu";
import { getMejaList } from "@/lib/actions/meja";
import { getSession } from "@/lib/actions/auth";
import { getPesananForEdit } from "@/lib/actions/pesanan";
import PemesananClient from "./PemesananClient";

export default async function PemesananPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const idPesananEdit = edit && !Number.isNaN(Number(edit)) ? Number(edit) : null;

  const [menuList, mejaList, session, pesananEdit] = await Promise.all([
    getMenuList(),
    getMejaList(),
    getSession(),
    idPesananEdit ? getPesananForEdit(idPesananEdit) : Promise.resolve(null),
  ]);

  return (
    <PemesananClient
      key={idPesananEdit ?? "baru"}
      menuList={menuList.filter((m) => m.statusMenu === "aktif")}
      mejaList={mejaList}
      idKaryawan={session?.idKaryawan ?? 0}
      pesananEdit={pesananEdit}
    />
  );
}