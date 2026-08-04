import type { Pool, PoolConnection } from "mysql2/promise";

type Db = Pool | PoolConnection;

export async function sinkronkanStokDanMenu(db: Db) {
  await db.query(
    `UPDATE Bahan_Baku SET status_stok = CASE
       WHEN stok_tersedia <= 0 THEN 'habis'
       WHEN stok_tersedia <= batas_minimum THEN 'menipis'
       ELSE 'aman'
     END`
  );

  await db.query(
    `UPDATE Menu m
     JOIN Resep r ON r.id_menu = m.id_menu
     JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
     SET m.status_menu = 'nonaktif'
     WHERE b.status_stok = 'habis'`
  );

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