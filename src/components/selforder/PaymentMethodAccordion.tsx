"use client";

import { useState } from "react";
import type { MetodePembayaranSelfOrder } from "@/lib/types";
import Image from "next/image";

const GROUPS: { title: string; options: { id: MetodePembayaranSelfOrder; label: string }[] }[] = [
  {
    title: "Virtual Account",
    options: [
      { id: "bri_va", label: "BRI" },
      { id: "bca_va", label: "BCA" },
      { id: "bni_va", label: "BNI" },
    ],
  },
  {
    title: "QRIS",
    options: [{ id: "qris", label: "QRIS" }],
  },
];

export default function PaymentMethodAccordion({
  selected,
  onSelect,
}: {
  selected: MetodePembayaranSelfOrder | null;
  onSelect: (m: MetodePembayaranSelfOrder) => void;
}) {
  const [openGroups, setOpenGroups] = useState<string[]>(GROUPS.map((g) => g.title));

  function toggleGroup(title: string) {
    setOpenGroups((prev) =>
      prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {GROUPS.map((group) => {
        const isOpen = openGroups.includes(group.title);
        return (
          <div key={group.title}>
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between font-semibold mb-2"
            >
              {group.title}
              <span>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-3">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onSelect(opt.id)}
                    className={`flex items-center gap-3 rounded-xl p-4 border transition-colors ${
                      selected === opt.id
                        ? "bg-[#2d5a4a] border-[#2d5a4a]"
                        : "bg-[#fdf8f0] border-transparent"
                    }`}
                  >
                    <Image
                      src={`/icons/payment/${opt.id}.png`}
                      alt={opt.label}
                      width={35}
                      height={35}
                      className="shrink-0 object-contain"
                    />
                    <span
                      className={`flex-1 text-left font-medium ${
                        selected === opt.id ? "text-white" : "text-black"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selected === opt.id ? "border-white" : "border-black/30"
                      }`}
                    >
                      {selected === opt.id && <span className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}