import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

const adminMenuItems = [
  { label: "Kelola Staff", href: "/kelola-staff", icon: <Image src="/icons/sidebar/Kelola Staff.png" alt="Kelola Staff" width={35} height={35}/> },
  { label: "Kelola Meja", href: "/kelola-meja", icon: <Image src="/icons/sidebar/Kelola Meja.png" alt="Kelola Meja" width={35} height={35}/> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout menuItems={adminMenuItems}>
      {children}
    </DashboardLayout>
  );
}