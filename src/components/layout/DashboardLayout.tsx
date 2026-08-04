"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { SidebarMenuItem } from "./Sidebar";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";
import { logout } from "@/lib/actions/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  menuItems: SidebarMenuItem[];
}

export default function DashboardLayout({
  children,
  menuItems,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  async function handleConfirmLogout() {
    setIsLogoutConfirmOpen(false);
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-screen bg-[#e2e2e2] overflow-hidden print:hidden">
      <Sidebar
        menuItems={menuItems}
        onLogout={() => setIsLogoutConfirmOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
      />
      <main
        className={`
          h-screen
          overflow-y-auto
          transition-all
          duration-300
          ${isSidebarOpen ? "ml-[250px]" : "ml-20"}
          print:ml-0
          print:h-auto
          print:overflow-visible
        `}
      >
        {children}
      </main>

    <ConfirmDeleteModal
        isOpen={isLogoutConfirmOpen}
        title="Keluar"
        description="Apakah Anda yakin ingin keluar dari akun ini?"
        confirmLabel="Keluar"
        variant="primary"
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}