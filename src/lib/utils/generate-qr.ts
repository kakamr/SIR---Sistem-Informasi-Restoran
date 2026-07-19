import QRCode from "qrcode";

/**
 * Generate QR code sebagai data URL (base64 PNG) dari sebuah URL.
 * Dipakai untuk menampilkan/print QR code tiap meja.
 */
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