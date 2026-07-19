import KasirLayout from "@/components/kasir/layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KasirLayout>{children}</KasirLayout>;
}