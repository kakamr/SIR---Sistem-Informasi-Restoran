import type { PoolConnection } from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

interface StokKurangRow extends RowDataPacket {
  nama_bahan: string;
  satuan: string;
  stok_tersedia: number;
  dibutuhkan: number;
}

/**
 * Cek apakah stok bahan baku cukup untuk daftar item yang dipesan.
 * WAJIB dipanggil di dalam transaksi, SEBELUM stok dikurangi.
 *
 * @returns null kalau stok cukup, atau pesan error kalau ada bahan yang kurang.
 *
 * Catatan: menu yang belum punya resep otomatis lolos pengecekan,
 * karena tidak ada bahan yang bisa dihitung kebutuhannya.
 */
export async function cekStokCukup(
  connection: PoolConnection,
  items: { idMenu: number; jumlah: number }[]
): Promise<string | null> {
  if (items.length === 0) return null;

  const idMenuList = items.map((i) => i.idMenu);
  const placeholderMenu = idMenuList.map(() => "?").join(", ");

  // Kunci baris bahan yang terlibat, supaya tidak ada transaksi lain
  // (misal kasir dan self-order bersamaan) yang menyerobot stok
  // di antara pengecekan dan pengurangan.
  await connection.query(
    `SELECT b.id_bahan
     FROM Bahan_Baku b
     JOIN Resep r ON r.id_bahan = b.id_bahan
     WHERE r.id_menu IN (${placeholderMenu})
     FOR UPDATE`,
    idMenuList
  );

  // Susun daftar item jadi tabel sementara: (id_menu, jumlah)
  const unionItems = items.map(() => "SELECT ? AS id_menu, ? AS jumlah").join(" UNION ALL ");
  const params: number[] = [];
  for (const item of items) {
    params.push(item.idMenu, item.jumlah);
  }

  const [kurangRows] = await connection.query<StokKurangRow[]>(
    `SELECT b.nama_bahan, b.satuan, b.stok_tersedia,
            SUM(r.jumlah_dibutuhkan * x.jumlah) AS dibutuhkan
     FROM (${unionItems}) x
     JOIN Resep r ON r.id_menu = x.id_menu
     JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
     GROUP BY b.id_bahan, b.nama_bahan, b.satuan, b.stok_tersedia
     HAVING dibutuhkan > b.stok_tersedia`,
    params
  );

  if (kurangRows.length === 0) return null;

  const detail = kurangRows
    .map(
      (r) =>
        `${r.nama_bahan} (butuh ${Number(r.dibutuhkan)} ${r.satuan}, tersedia ${Number(
          r.stok_tersedia
        )} ${r.satuan})`
    )
    .join("; ");

  return `Stok bahan tidak mencukupi — ${detail}`;
}