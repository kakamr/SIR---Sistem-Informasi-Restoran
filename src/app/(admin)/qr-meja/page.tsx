import Header from "@/components/layout/Header";
import { getQrCodeMejaList } from "@/lib/actions/qr";
import { headers } from "next/headers";
import QrMejaClient from "./QrMejaClient";

export default async function QrMejaPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const qrList = await getQrCodeMejaList(baseUrl);

  return (
    <>
      <Header dashboardLabel="Admin Dashboard" pageTitle="QR Meja" />
      <QrMejaClient qrList={qrList} />
    </>
  );
}