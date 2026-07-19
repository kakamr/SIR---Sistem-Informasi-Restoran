const METODE_LABEL: Record<string, string> = {
  gopay: "Gopay",
  dana: "Dana",
  bri_va: "BRI Virtual Account",
  bca_va: "BCA Virtual Account",
  bni_va: "BNI Virtual Account",
  qris: "QRIS",
};

interface StrukItem {
  namaMenu: string;
  jumlah: number;
  hargaSatuan: number;
  subtotal: number;
  catatanItem?: string;
}

interface StrukData {
  idPembayaran: number;
  nomorMeja: string;
  tanggal: string;
  metodePembayaran: string;
  totalPembayaran: number;
  items: StrukItem[];
}

function formatRupiahPlain(value: number): string {
  return "Rp" + new Intl.NumberFormat("id-ID").format(value);
}

function formatTanggalPlain(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function generateStrukCanvas(data: StrukData): Promise<HTMLCanvasElement> {
  const WIDTH = 400;
  // Tinggi dihitung dinamis tergantung jumlah item + apakah ada catatan
  const baseHeight = 620;
  const perItemHeight = 26;
  const catatanExtra = data.items.filter((i) => i.catatanItem).length * 16;
  const HEIGHT = baseHeight + data.items.length * perItemHeight + catatanExtra;

  const canvas = document.createElement("canvas");
  const scale = 2; // render 2x untuk hasil tajam (retina-like)
  canvas.width = WIDTH * scale;
  canvas.height = HEIGHT * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // ---------- Background luar (abu-abu/beige) ----------
  ctx.fillStyle = "#e8e4dc";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ---------- Header (krem) ----------
  const headerHeight = 195;
  ctx.fillStyle = "#fdf8f0";
  roundRectTopOnly(ctx, 0, 0, WIDTH, headerHeight, 24);
  ctx.fill();

  // Logo SIR
  ctx.fillStyle = "#2d5a4a";
  ctx.font = "bold 44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SIR", WIDTH / 2, 78);

  // Subjudul
  ctx.fillStyle = "#4a4a4a";
  ctx.font = "16px Arial";
  ctx.fillText("Pembayaran Telah Berhasil", WIDTH / 2, 112);

  // Total besar
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 32px Arial";
  ctx.fillText(formatRupiahPlain(data.totalPembayaran), WIDTH / 2, 155);

  // ---------- Card Detail Transaksi ----------
  let y = headerHeight + 25;
  const cardX = 24;
  const cardWidth = WIDTH - 48;

  ctx.fillStyle = "#fdf8f0";
  roundRect(ctx, cardX, y, cardWidth, 150, 16);
  ctx.fill();

  y += 32;
  ctx.textAlign = "left";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Detail Transaksi", cardX + 20, y);

  y += 28;
  ctx.font = "13px Arial";
  drawRow(ctx, "ID Pembayaran", `PMB${String(data.idPembayaran).padStart(6, "0")}`, cardX + 20, cardWidth - 40, y);
  y += 22;
  drawRow(ctx, "No Meja", data.nomorMeja, cardX + 20, cardWidth - 40, y);
  y += 22;
  drawRow(ctx, "Tanggal", formatTanggalPlain(data.tanggal), cardX + 20, cardWidth - 40, y);
  y += 22;
  drawRow(ctx, "Metode Pembayaran", METODE_LABEL[data.metodePembayaran] ?? data.metodePembayaran, cardX + 20, cardWidth - 40, y);

  // ---------- Card Detail Pesanan ----------
  y = headerHeight + 25 + 130 + 30;
  const itemsCardHeight = 45 + data.items.length * perItemHeight + catatanExtra;

  ctx.fillStyle = "#fdf8f0";
  roundRect(ctx, cardX, y, cardWidth, itemsCardHeight, 16);
  ctx.fill();

  y += 32;
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Detail Pesanan", 126 + cardX, y);

  y += 24;
  ctx.font = "13px Arial";
  for (const item of data.items) {
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "left";
    ctx.fillText(`${item.namaMenu} x${item.jumlah}`, cardX + 20, y);
    ctx.textAlign = "right";
    ctx.fillText(formatRupiahPlain(item.subtotal), cardX + cardWidth - 20, y);
    y += 17;

    if (item.catatanItem) {
      ctx.fillStyle = "#6b6b6b";
      ctx.font = "italic 11px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Catatan : ${item.catatanItem}`, cardX + 20, y);
      ctx.font = "13px Arial";
      y += 16;
    }

    y += 6;
  }

  // ---------- Card Total ----------
  y += 25;
  ctx.fillStyle = "#fdf8f0";
  roundRect(ctx, cardX, y, cardWidth, 70, 16);
  ctx.fill();

  y += 44;
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Total", cardX + 20, y);
  ctx.textAlign = "right";
  ctx.fillText(formatRupiahPlain(data.totalPembayaran), cardX + cardWidth - 20, y);

  return canvas;
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  width: number,
  y: number
) {
  ctx.fillStyle = "#6b6b6b";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "#1a1a1a";
  ctx.textAlign = "right";
  ctx.fillText(value, x + width, y);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function roundRectTopOnly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x, y + height);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function downloadCanvasAsImage(canvas: HTMLCanvasElement, fileName: string) {
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}