import Header from "@/components/layout/Header";
import { getKaryawanList } from "@/lib/actions/karyawan";
import KelolaStaffClient from "./KelolaStaffClient";

export default async function KelolaStaffPage() {
  const initialStaff = await getKaryawanList();

  return (
    <>
      <Header dashboardLabel="Admin Dashboard" pageTitle="Kelola Staff" />
      <KelolaStaffClient initialStaff={initialStaff} />
    </>
  );
}