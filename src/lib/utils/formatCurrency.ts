/**
 * Format angka menjadi format Rupiah.
 * Contoh: formatRupiah(25000) -> "Rp 25.000"
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format angka biasa dengan pemisah ribuan, tanpa "Rp".
 * Contoh: formatNumber(1000000) -> "1.000.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Format tanggal ke format Indonesia.
 * Contoh: formatTanggal("2026-07-07") -> "07 Juli 2026"
 */
export function formatTanggal(dateString: string): string {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}