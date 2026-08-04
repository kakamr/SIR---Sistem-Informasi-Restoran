import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#2d5a4a",
      light: "#ffffff",
    },
  });
}