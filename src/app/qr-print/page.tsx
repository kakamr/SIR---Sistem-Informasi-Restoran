import { headers } from "next/headers";
import { getQrCodeMejaList } from "@/lib/actions/qr";
import QrPrintClient from "./QrPrintClient";

export default async function QrPrintPage() {
  const headersList = await headers();

  const host = headersList.get("host") ?? "localhost:3000";
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : "http";

  const baseUrl = `${protocol}://${host}`;

  const qrList = await getQrCodeMejaList(baseUrl);

  return <QrPrintClient qrList={qrList} />;
}