import { NextRequest, NextResponse } from "next/server";
import type { RoleKaryawan } from "@/lib/types";

const ROLE_ROUTE_MAP: { prefix: string; role: RoleKaryawan }[] = [
  { prefix: "/pemesanan", role: "kasir" },
  { prefix: "/pesanan", role: "kasir" },
  { prefix: "/laporan", role: "kasir" },
  { prefix: "/antrian", role: "koki" },
  { prefix: "/menu", role: "koki" },
  { prefix: "/stok", role: "koki" },
  { prefix: "/penyajian", role: "pelayan" },
  { prefix: "/meja", role: "pelayan" },
  { prefix: "/admin-laporan", role: "admin" },
  { prefix: "/kelola-meja", role: "admin" },
  { prefix: "/qr-meja", role: "admin" },
  { prefix: "/kelola-staff", role: "admin" },
];

const DEFAULT_ROUTE_BY_ROLE: Record<RoleKaryawan, string> = {
  kasir: "/pemesanan",
  koki: "/antrian",
  pelayan: "/penyajian",
  admin: "/admin-laporan",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Halaman login dan seluruh alur self-order pelanggan (/order/*)
  // TIDAK memerlukan autentikasi staff sama sekali - lewati middleware ini
  if (pathname === "/login" || pathname.startsWith("/order")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("sir_session")?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role: RoleKaryawan;
  try {
    const session = JSON.parse(sessionCookie);
    role = session.role;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const matchedRoute = ROLE_ROUTE_MAP.find((r) => pathname.startsWith(r.prefix));

  if (matchedRoute && matchedRoute.role !== role) {
    return NextResponse.redirect(new URL(DEFAULT_ROUTE_BY_ROLE[role], request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(DEFAULT_ROUTE_BY_ROLE[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|uploads|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};