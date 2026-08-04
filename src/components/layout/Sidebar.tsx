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
        {}
        <div className="relative h-24 border-b border-[#fdf8f0]/10 px-6 flex flex-col justify-center">
          <button
            onClick={onToggle}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#fdf8f0] shadow-lg z-50"
          >
            {isOpen ? "◀" : "▶"}
          </button>

          <h1 className="text-[#fdf8f0] text-3xl font-bold text-center">SIR</h1>

          {isOpen && (
            <p className="text-[#fdf8f0]/70 text-sm text-center mt-2">
              Sistem Informasi Restoran
            </p>
          )}
        </div>

        {}
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
                      ? "bg-[#fdf8f0]/15 text-[#fdf8f0] font-semibold"
                      : "text-[#fdf8f0]/80 hover:bg-[#fdf8f0]/10"
                  }
                `}
              >
                {item.icon ?? (
                  <div className="w-8 h-8 rounded bg-[#fdf8f0]/20 shrink-0" />
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

      {}
      <div className="p-4 border-t border-[#fdf8f0]/10">
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
            text-[#fdf8f0]/80
            hover:bg-[#fdf8f0]/10
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