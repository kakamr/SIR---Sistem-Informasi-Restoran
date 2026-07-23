"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { Menu, ResepItem } from "@/lib/types";
import { sinkronkanStokDanMenu } from "@/lib/utils/sinkron-menu";;

interface MenuWithResepRow extends RowDataPacket {
  id_menu: number;
  nama_menu: string;
  kategori: string | null;
  harga: number;
  deskripsi: string | null;
  instruksi_masak: string | null;
  gambar_url: string | null; // tambahkan ini
  status_menu: "aktif" | "nonaktif";

  id_bahan: number | null;
  nama_bahan: string | null;
  jumlah_dibutuhkan: number | null;
  satuan: string | null;
}

interface JumlahDetailPesananRow extends RowDataPacket {
  jumlah: number;
}

export async function getMenuList(): Promise<Menu[]> {
  const [rows] = await pool.query<MenuWithResepRow[]>(`
    SELECT
      m.id_menu, m.nama_menu, m.kategori, m.harga, m.deskripsi,
      m.instruksi_masak, m.gambar_url, m.status_menu,
      r.id_bahan, r.jumlah_dibutuhkan,
      b.nama_bahan, b.satuan
    FROM Menu m
    LEFT JOIN Resep r ON r.id_menu = m.id_menu
    LEFT JOIN Bahan_Baku b ON b.id_bahan = r.id_bahan
    ORDER BY m.id_menu ASC
  `);

  const grouped = new Map<number, Menu>();

  for (const row of rows) {
    if (!grouped.has(row.id_menu)) {
      grouped.set(row.id_menu, {
        idMenu: row.id_menu,
        namaMenu: row.nama_menu,
        kategori: row.kategori ?? undefined,
        harga: Number(row.harga),
        deskripsi: row.deskripsi ?? undefined,
        instruksiMasak: row.instruksi_masak ?? undefined,
        gambarUrl: row.gambar_url ?? undefined, // tambahkan ini
        statusMenu: row.status_menu,
        bahan: [],
      });
    }

    if (row.id_bahan !== null) {
      const menu = grouped.get(row.id_menu);

      if (
        menu &&
        row.id_bahan !== null &&
        row.nama_bahan !== null &&
        row.jumlah_dibutuhkan !== null &&
        row.satuan !== null
      ) {
        menu.bahan!.push({
          idBahan: row.id_bahan,
          namaBahan: row.nama_bahan,
          jumlahDibutuhkan: Number(row.jumlah_dibutuhkan),
          satuan: row.satuan,
        });
      }
    }
  }

  return Array.from(grouped.values());
}

export async function createMenu(data: {
  namaMenu: string;
  kategori?: string;
  harga: number;
  deskripsi?: string;
  instruksiMasak?: string;
  gambarUrl?: string;
  bahan: ResepItem[];
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO Menu (nama_menu, kategori, harga, deskripsi, instruksi_masak, gambar_url, status_menu) VALUES (?, ?, ?, ?, ?, ?, 'aktif')",
      [data.namaMenu, data.kategori ?? null, data.harga, data.deskripsi ?? null, data.instruksiMasak ?? null, data.gambarUrl ?? null]
    );

    const idMenu = result.insertId;

    for (const b of data.bahan) {
      await connection.query<ResultSetHeader>(
        "INSERT INTO Resep (id_menu, id_bahan, jumlah_dibutuhkan) VALUES (?, ?, ?)",
        [idMenu, b.idBahan, b.jumlahDibutuhkan]
      );
    }

    await sinkronkanStokDanMenu(connection);

    await connection.commit();
    revalidatePath("/menu");
    revalidatePath("/pemesanan");
    return { success: true, idMenu };
  } catch (error) {
    await connection.rollback();
    console.error("createMenu error:", error);
    return { success: false, message: "Gagal menyimpan menu" };
  } finally {
    connection.release();
  }
}

export async function updateMenu(
  idMenu: number,
  data: {
    namaMenu: string;
    kategori?: string;
    harga: number;
    deskripsi?: string;
    instruksiMasak?: string;
    gambarUrl?: string;
    bahan: ResepItem[];
  }
) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query<ResultSetHeader>(
      "UPDATE Menu SET nama_menu = ?, kategori = ?, harga = ?, deskripsi = ?, instruksi_masak = ?, gambar_url = ? WHERE id_menu = ?",
      [data.namaMenu, data.kategori ?? null, data.harga, data.deskripsi ?? null, data.instruksiMasak ?? null, data.gambarUrl ?? null, idMenu]
    );

    await connection.query<ResultSetHeader>("DELETE FROM Resep WHERE id_menu = ?", [idMenu]);

    for (const b of data.bahan) {
      await connection.query<ResultSetHeader>(
        "INSERT INTO Resep (id_menu, id_bahan, jumlah_dibutuhkan) VALUES (?, ?, ?)",
        [idMenu, b.idBahan, b.jumlahDibutuhkan]
      );
    }

    await sinkronkanStokDanMenu(connection);

    await connection.commit();
    revalidatePath("/menu");
    revalidatePath("/pemesanan");
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("updateMenu error:", error);
    return { success: false, message: "Gagal mengupdate menu" };
  } finally {
    connection.release();
  }
}

export async function deleteMenu(idMenu: number) {
  try {
    const [detailRows] = await pool.query<JumlahDetailPesananRow[]>(
      "SELECT COUNT(*) as jumlah FROM Detail_Pesanan WHERE id_menu = ?",
      [idMenu]
    );

    if (detailRows[0].jumlah > 0) {
      return {
        success: false,
        message: "Menu ini pernah dipesan dan tidak bisa dihapus. Gunakan tombol Nonaktifkan sebagai gantinya.",
      };
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query<ResultSetHeader>("DELETE FROM Resep WHERE id_menu = ?", [idMenu]);
      await connection.query<ResultSetHeader>("DELETE FROM Menu WHERE id_menu = ?", [idMenu]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("deleteMenu error:", error);
    return { success: false, message: "Gagal menghapus menu" };
  }
}

export async function toggleStatusMenu(idMenu: number, statusBaru: "aktif" | "nonaktif") {
  try {
    await pool.query("UPDATE Menu SET status_menu = ? WHERE id_menu = ?", [statusBaru, idMenu]);
    revalidatePath("/menu");
    revalidatePath("/pemesanan");
    return { success: true };
  } catch (error) {
    console.error("toggleStatusMenu error:", error);
    return { success: false, message: "Gagal mengubah status menu" };
  }
}