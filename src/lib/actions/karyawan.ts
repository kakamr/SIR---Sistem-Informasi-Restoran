"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { RoleKaryawan } from "@/lib/types";

export interface KaryawanListItem {
  idKaryawan: number;
  namaKaryawan: string;
  role: RoleKaryawan;
  username: string;
  noTelepon?: string;
}

interface KaryawanRow extends RowDataPacket {
  id_karyawan: number;
  nama_karyawan: string;
  role: RoleKaryawan;
  username: string;
  no_telepon: string | null;
}

interface IdKaryawanRow extends RowDataPacket {
  id_karyawan: number;
}

interface JumlahPesananRow extends RowDataPacket {
  jumlah: number;
}

export async function getKaryawanList(): Promise<KaryawanListItem[]> {
  const [rows] = await pool.query<KaryawanRow[]>(
    "SELECT id_karyawan, nama_karyawan, role, username, no_telepon FROM Karyawan ORDER BY id_karyawan ASC"
  );
  return rows.map((row) => ({
    idKaryawan: row.id_karyawan,
    namaKaryawan: row.nama_karyawan,
    role: row.role,
    username: row.username,
    noTelepon: row.no_telepon ?? undefined,
  }));
}

export async function createKaryawan(data: {
  namaKaryawan: string;
  role: RoleKaryawan;
  username: string;
  password: string;
  noTelepon?: string;
}) {
  try {
    const [existing] = await pool.query<IdKaryawanRow[]>("SELECT id_karyawan FROM Karyawan WHERE username = ?", [
      data.username,
    ]);
    if (existing.length > 0) {
      return { success: false, message: "Username sudah dipakai" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await pool.query<ResultSetHeader>(
      "INSERT INTO Karyawan (nama_karyawan, role, username, password_hash, no_telepon) VALUES (?, ?, ?, ?, ?)",
      [data.namaKaryawan, data.role, data.username, passwordHash, data.noTelepon ?? null]
    );

    revalidatePath("/kelola-staff");
    return { success: true };
  } catch (error) {
    console.error("createKaryawan error:", error);
    return { success: false, message: "Gagal menambahkan staff" };
  }
}

export async function deleteKaryawan(idKaryawan: number) {
  try {
    const [pesananAktifRows] = await pool.query<JumlahPesananRow[]>(
      "SELECT COUNT(*) as jumlah FROM Pesanan WHERE id_karyawan = ? AND status_pesanan NOT IN ('selesai', 'dibatalkan')",
      [idKaryawan]
    );
    if (pesananAktifRows[0].jumlah > 0) {
      return { success: false, message: "Staff ini masih memiliki pesanan aktif yang ditangani" };
    }

    await pool.query<ResultSetHeader>("DELETE FROM Karyawan WHERE id_karyawan = ?", [idKaryawan]);
    revalidatePath("/kelola-staff");
    return { success: true };
  } catch (error) {
    console.error("deleteKaryawan error:", error);
    return { success: false, message: "Gagal menghapus staff" };
  }
}

export async function updateKaryawan(
  idKaryawan: number,
  data: {
    namaKaryawan: string;
    role: RoleKaryawan;
    username: string;
    password?: string; // opsional - kalau kosong, password lama tidak diubah
    noTelepon?: string;
  }
) {
  try {
    const [existing] = await pool.query<IdKaryawanRow[]>(
      "SELECT id_karyawan FROM Karyawan WHERE username = ? AND id_karyawan != ?",
      [data.username, idKaryawan]
    );
    if (existing.length > 0) {
      return { success: false, message: "Username sudah dipakai staff lain" };
    }

    if (data.password && data.password.trim().length > 0) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      await pool.query<ResultSetHeader>(
        "UPDATE Karyawan SET nama_karyawan = ?, role = ?, username = ?, password_hash = ?, no_telepon = ? WHERE id_karyawan = ?",
        [data.namaKaryawan, data.role, data.username, passwordHash, data.noTelepon ?? null, idKaryawan]
      );
    } else {
      // Password tidak diisi = tidak diubah, cukup update field lainnya
      await pool.query<ResultSetHeader>(
        "UPDATE Karyawan SET nama_karyawan = ?, role = ?, username = ?, no_telepon = ? WHERE id_karyawan = ?",
        [data.namaKaryawan, data.role, data.username, data.noTelepon ?? null, idKaryawan]
      );
    }

    revalidatePath("/kelola-staff");
    return { success: true };
  } catch (error) {
    console.error("updateKaryawan error:", error);
    return { success: false, message: "Gagal mengupdate staff" };
  }
}