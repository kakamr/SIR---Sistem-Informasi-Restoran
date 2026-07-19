"use server";

import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import pool from "@/lib/db";
import type { RoleKaryawan } from "@/lib/types";
import type { RowDataPacket } from "mysql2";

interface LoginResult {
  success: boolean;
  message?: string;
}

interface KaryawanRow extends RowDataPacket {
  id_karyawan: number;
  nama_karyawan: string;
  role: RoleKaryawan;
  username: string;
  password_hash: string;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const [rows] = await pool.query<KaryawanRow[]>(
      "SELECT id_karyawan, nama_karyawan, role, username, password_hash FROM Karyawan WHERE username = ?",
      [username]
    );

    const user = rows[0];

    if (!user) {
      return { success: false, message: "Username atau password salah" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, message: "Username atau password salah" };
    }

    const cookieStore = await cookies();
    cookieStore.set(
      "sir_session",
      JSON.stringify({
        idKaryawan: user.id_karyawan,
        namaKaryawan: user.nama_karyawan,
        role: user.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 jam
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Terjadi kesalahan server" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("sir_session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sir_session")?.value;
  if (!sessionCookie) return null;
  try {
    return JSON.parse(sessionCookie);
  } catch {
    return null;
  }
}