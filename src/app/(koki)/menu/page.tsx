import Header from "@/components/layout/Header";
import { getMenuList } from "@/lib/actions/menu";
import { getBahanList } from "@/lib/actions/bahan";
import MenuClient from "./MenuClient";

export default async function MenuPage() {
  const [menuList, bahanList] = await Promise.all([getMenuList(), getBahanList()]);

  return (
    <>
      <Header dashboardLabel="Koki Dashboard" pageTitle="Menu" />
      <MenuClient initialMenuList={menuList} bahanList={bahanList} />
    </>
  );
}