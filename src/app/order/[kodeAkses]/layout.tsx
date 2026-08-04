import { CartProvider } from "@/lib/cart-context";

export default async function OrderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ kodeAkses: string }>;
}) {
  const { kodeAkses } = await params;

  return (
    <div className="min-h-screen bg-[#e2e2e2]">
      <CartProvider idMeja={kodeAkses}>{children}</CartProvider>
    </div>
  );
}