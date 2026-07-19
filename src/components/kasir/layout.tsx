import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

const kasirMenuItems = [
  { label: "Pemesanan", href: "/pemesanan", icon: <Image src="/icons/sidebar/Pemesanan.png" alt="Pemesanan" width={35} height={35}/>},
  { label: "Pesanan", href: "/pesanan", icon: <Image src="/icons/sidebar/Pesanan.png" alt="Pesanan" width={35} height={35}/> },
  { label: "Laporan", href: "/laporan", icon: <Image src="/icons/sidebar/Laporan.png" alt="Laporan" width={35} height={35}/> },
];

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout menuItems={kasirMenuItems}>
      {children}
    </DashboardLayout>
  );
}