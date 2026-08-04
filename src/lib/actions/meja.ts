"use server";

import { randomBytes } from "crypto";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Meja } from "@/lib/types";
import { revalidatePath } from "next/cache";

interface MejaRow extends RowDataPacket{
  id_meja: number;
  nomor_meja: string;
  kapasitas: number;
  status_meja: "kosong" | "terisi";
  qr_code: string | null;
  kode_akses: string | null;
}

interface JumlahPesananRow extends RowDataPacket {
  jumlah: number;
}

function mapRowToMeja(row: MejaRow): Meja {
  return {
    idMeja: row.id_meja,
    nomorMeja: row.nomor_meja,
    kapasitas: row.kapasitas,
    statusMeja: row.status_meja,
    qrCode: row.qr_code ?? undefined,
    kodeAkses: row.kode_akses ?? undefined,
  };
}

export async function getMejaList(): Promise<Meja[]> {
  const [rows] = await pool.query<MejaRow[]>("SELECT * FROM Meja ORDER BY id_meja ASC");
  return rows.map(mapRowToMeja);
}

export async function updateStatusMeja(
  idMeja: number,
  status: "kosong" | "terisi"
) {
  try {
    await pool.query(
      `
      UPDATE Meja
      SET status_meja = ?
      WHERE id_meja = ?
      `,
      [status, idMeja]
    );

    revalidatePath("/meja");
    revalidatePath("/pemesanan");

    return { success: true };
  } catch (error) {
    console.error("updateStatusMeja error:", error);

    return {
      success: false,
      message: "Gagal mengubah status meja",
    };
  }
}

export async function getMejaById(idMeja: number): Promise<Meja | null> {
  const [rows] = await pool.query<MejaRow[]>("SELECT * FROM Meja WHERE id_meja = ?", [idMeja]);
  if (!rows[0]) return null;
  return mapRowToMeja(rows[0]);
}

export async function getMejaByKodeAkses(kodeAkses: string): Promise<Meja | null> {
  const [rows] = await pool.query<MejaRow[]>("SELECT * FROM Meja WHERE kode_akses = ?", [kodeAkses]);
  if (!rows[0]) return null;
  return mapRowToMeja(rows[0]);
}

export async function createMeja(data: { nomorMeja: string; kapasitas: number }) {
  try {
    const kodeAkses = randomBytes(6).toString("hex");
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO Meja (nomor_meja, kapasitas, status_meja, kode_akses) VALUES (?, ?, 'kosong', ?)",
      [data.nomorMeja, data.kapasitas, kodeAkses]
    );
    revalidatePath("/kelola-meja");
    revalidatePath("/qr-meja");
    revalidatePath("/pemesanan");
    return { success: true, idMeja: result.insertId };
  } catch (error) {
    console.error("createMeja error:", error);
    return { success: false, message: "Gagal menambahkan meja" };
  }
}

export async function deleteMeja(idMeja: number) {
  try {
    const [pesananAktifRows] = await pool.query<JumlahPesananRow[]>(
      "SELECT COUNT(*) as jumlah FROM Pesanan WHERE id_meja = ? AND status_pesanan NOT IN ('selesai', 'dibatalkan')",
      [idMeja]
    );
    if (pesananAktifRows[0].jumlah > 0) {
      return { success: false, message: "Meja ini masih memiliki pesanan aktif" };
    }

    await pool.query("DELETE FROM Meja WHERE id_meja = ?", [idMeja]);
    revalidatePath("/kelola-meja");
    revalidatePath("/qr-meja");
    return { success: true };
  } catch (error) {
    console.error("deleteMeja error:", error);
    return { success: false, message: "Gagal menghapus meja" };
  }
}