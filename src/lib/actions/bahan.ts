"use server";

import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { BahanBaku } from "@/lib/types";

interface BahanRow extends RowDataPacket {
  id_bahan: number;
  nama_bahan: string;
  satuan: string;
  stok_tersedia: number;
  batas_minimum: number;
  status_stok: "aman" | "menipis" | "habis";
}

function mapRow(row: BahanRow): BahanBaku {
  return {
    idBahan: row.id_bahan,
    namaBahan: row.nama_bahan,
    satuan: row.satuan,
    stokTersedia: Number(row.stok_tersedia),
    batasMinimum: Number(row.batas_minimum),
    statusStok: row.status_stok,
  };
}

export async function getBahanList(): Promise<BahanBaku[]> {
  const [rows] = await pool.query<BahanRow[]>("SELECT * FROM Bahan_Baku");
  return rows.map(mapRow);
}

function hitungStatusStok(stok: number, batasMin: number): "aman" | "menipis" | "habis" {
  if (stok <= 0) return "habis";
  if (stok <= batasMin) return "menipis";
  return "aman";
}

export async function createBahan(data: {
  namaBahan: string;
  satuan: string;
  gambarUrl?: string;
  stokTersedia: number;
  batasMinimum: number;
}) {
  try {
    const statusStok = hitungStatusStok(data.stokTersedia, data.batasMinimum);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO Bahan_Baku (nama_bahan, satuan, gambar_url, stok_tersedia, batas_minimum, status_stok) VALUES (?, ?, ?, ?, ?, ?)",
      [data.namaBahan, data.satuan, data.gambarUrl ?? null, data.stokTersedia, data.batasMinimum, statusStok]
    );
    revalidatePath("/stok");
    return { success: true, idBahan: result.insertId };
  } catch (error) {
    console.error("createBahan error:", error);
    return { success: false, message: "Gagal menyimpan bahan" };
  }
}

export async function updateBahan(
  idBahan: number,
  data: { namaBahan: string; satuan: string; gambarUrl?: string; stokTersedia: number; batasMinimum: number }
) {
  try {
    const statusStok = hitungStatusStok(data.stokTersedia, data.batasMinimum);
    await pool.query(
      "UPDATE Bahan_Baku SET nama_bahan = ?, satuan = ?, gambar_url = ?, stok_tersedia = ?, batas_minimum = ?, status_stok = ? WHERE id_bahan = ?",
      [data.namaBahan, data.satuan, data.gambarUrl ?? null, data.stokTersedia, data.batasMinimum, statusStok, idBahan]
    );
    revalidatePath("/stok");
    return { success: true };
  } catch (error) {
    console.error("updateBahan error:", error);
    return { success: false, message: "Gagal mengupdate bahan" };
  }
}

export async function deleteBahan(idBahan: number) {
  try {
    // Cek dulu apakah bahan ini masih dipakai di Resep manapun
    const [resepRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as jumlah FROM Resep WHERE id_bahan = ?",
      [idBahan]
    );

    if (resepRows[0].jumlah > 0) {
      return {
        success: false,
        message: "Bahan ini masih digunakan di salah satu menu. Hapus dari resep menu terlebih dahulu.",
      };
    }

    await pool.query("DELETE FROM Bahan_Baku WHERE id_bahan = ?", [idBahan]);
    revalidatePath("/stok");
    return { success: true };
  } catch (error) {
    console.error("deleteBahan error:", error);
    return { success: false, message: "Gagal menghapus bahan" };
  }
}