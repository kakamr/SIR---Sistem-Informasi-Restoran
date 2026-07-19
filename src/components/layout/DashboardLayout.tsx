"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { SidebarMenuItem } from "./Sidebar";
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

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-screen bg-[#e2e2e2] overflow-hidden print:hidden">
      <Sidebar
        menuItems={menuItems}
        onLogout={handleLogout}
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
    </div>
  );
}