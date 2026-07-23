import type { Pool, PoolConnection } from "mysql2/promise";

type Db = Pool | PoolConnection;

/**
 * Hitung ulang status stok semua bahan, lalu selaraskan status menu:
 * - menu dinonaktifkan kalau ada bahannya yang habis
 * - menu diaktifkan lagi kalau semua bahannya sudah tersedia
 *
 * Panggil setiap kali stok bahan atau isi resep berubah.
 * Bisa menerima `pool` (tanpa transaksi) maupun `connection` (di dalam transaksi).
 */
export async function sinkronkanStokDanMenu(db: Db) {
  // 1. Status stok tiap bahan mengikuti sisa stok dan batas minimumnya
  await db.query(
    `UPDATE Bahan_Baku SET status_stok = CASE
       WHEN stok_tersedia <= 0 THEN 'habis'
       WHEN stok_tersedia <= batas_minimum THEN 'menipis'
       ELSE 'aman'
     END`
  );

  // 2. Nonaktifkan menu yang salah satu bahannya habis
  await db.query(
    `UPDATE Menu m
     JOIN Resep r ON r.id_menu = m.id_menu
     JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
     SET m.status_menu = 'nonaktif'
     WHERE b.status_stok = 'habis'`
  );

  // 3. Aktifkan kembali menu yang sudah tidak punya bahan habis
  await db.query(
    `UPDATE Menu m
     JOIN Resep r ON r.id_menu = m.id_menu
     JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
     SET m.status_menu = 'aktif'
     WHERE m.status_menu = 'nonaktif'
       AND m.id_menu NOT IN (
         SELECT r2.id_menu FROM Resep r2
         JOIN Bahan_Baku b2 ON b2.id_bahan = r2.id_bahan
         WHERE b2.status_stok = 'habis'
       )`
  );
}