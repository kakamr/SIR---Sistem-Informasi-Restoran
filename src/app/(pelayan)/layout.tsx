import PelayanLayout from "@/components/pelayan/layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PelayanLayout>{children}</PelayanLayout>;
}