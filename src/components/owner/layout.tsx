import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

const ownerMenuItems = [
  {  label: "Laporan", href: "/laporan", icon: <Image src="/icons/sidebar/Laporan.png" alt="Laporan" width={35} height={35} />,  },
];

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout menuItems={ownerMenuItems}>
      {children}
    </DashboardLayout>
  );
}