import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

const kokiMenuItems = [
  { label: "Antrian", href: "/antrian", icon: <Image src="/icons/sidebar/Antrian.png" alt="Antrian" width={35} height={35}/> },
  { label: "Menu", href: "/menu", icon: <Image src="/icons/sidebar/Menu.png" alt="Menu" width={35} height={35}/> },
  { label: "Stok", href: "/stok", icon: <Image src="/icons/sidebar/Stok.png" alt="Stok" width={35} height={35}/> },
];

export default function KokiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout menuItems={kokiMenuItems}>
      {children}
    </DashboardLayout>
  );
}