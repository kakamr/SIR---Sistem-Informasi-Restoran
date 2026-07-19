import DashboardLayout from "@/components/layout/DashboardLayout";
import Image from "next/image";

const pelayanMenuItems = [
  { label: "Penyajian", href: "/penyajian", icon: <Image src="/icons/sidebar/Penyajian.png" alt="Penyajian" width={35} height={35}/> },
  { label: "Meja", href: "/meja", icon: <Image src="/icons/sidebar/Meja.png" alt="Meja" width={35} height={35}/> },
];

export default function PelayanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout menuItems={pelayanMenuItems}>
      {children}
    </DashboardLayout>
  );
}