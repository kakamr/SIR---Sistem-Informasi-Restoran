import KokiLayout from "@/components/koki/layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KokiLayout>{children}</KokiLayout>;
}