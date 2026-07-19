"use client";

import { useEffect } from "react";
import Image from "next/image";

interface QrMejaItem {
  idMeja: number;
  nomorMeja: string;
  orderUrl: string | null;
  qrDataUrl: string | null;
}

export default function QrPrintClient({
  qrList,
}: {
  qrList: QrMejaItem[];
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.onafterprint = () => {
        window.close();
      };

      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-8 bg-white">
      <div className="grid grid-cols-2 gap-6">
        {qrList
          .filter((q) => q.qrDataUrl)
          .map((item) => (
            <div
              key={item.idMeja}
              className="border rounded-xl p-6 flex flex-col items-center break-inside-avoid"
            >
              <p className="text-sm text-gray-500">
                SIR - Scan untuk memesan
              </p>

              <h2 className="text-3xl font-bold mb-4">
                {item.nomorMeja}
              </h2>

              <Image
                src={item.qrDataUrl!}
                alt="qr url"
                width={200}
                height={200}
              />

              <p className="text-xs mt-4 break-all text-center">
                {item.orderUrl}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}