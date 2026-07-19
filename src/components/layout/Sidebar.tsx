"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface SidebarProps {
  menuItems: SidebarMenuItem[];
  onLogout?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  menuItems,
  onLogout,
  isOpen,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        ${
          isOpen ? "w-[250px]" : "w-20"
        }
        fixed
        left-0
        top-0
        h-screen
        bg-[#2d5a4a]
        flex
        flex-col
        justify-between
        transition-all
        duration-300
        z-50
        shadow-xl
      `}
    >
      <div>
        {/* Header */}
        <div className="relative h-24 border-b border-white/10 px-6 flex flex-col justify-center">
          <button
            onClick={onToggle}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg z-50"
          >
            {isOpen ? "◀" : "▶"}
          </button>

          <h1 className="text-white text-3xl font-bold text-center">SIR</h1>

          {isOpen && (
            <p className="text-white/70 text-sm text-center mt-2">
              Sistem Informasi Restoran
            </p>
          )}
        </div>

        {/* Menu */}
        <nav className="p-4 flex flex-col gap-2">
          {menuItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex
                  items-center
                  ${
                    isOpen
                      ? "justify-start px-4"
                      : "justify-center px-2"
                  }
                  py-3
                  rounded-lg
                  transition
                  ${
                    active
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/80 hover:bg-white/10"
                  }
                `}
              >
                {item.icon ?? (
                  <div className="w-8 h-8 rounded bg-white/20 shrink-0" />
                )}

                {isOpen && (
                  <span className="ml-4 text-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => onLogout?.()}
          className={`
            w-full
            flex
            items-center
            ${
              isOpen
                ? "justify-start px-4"
                : "justify-center px-2"
            }
            py-3
            rounded-lg
            text-white/80
            hover:bg-white/10
            transition
          `}
        >
          <Image src="/icons/sidebar/Keluar.png" alt="logout" width={35} height={35}/>

          {isOpen && (
            <span className="ml-4 text-lg">
              Keluar
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}