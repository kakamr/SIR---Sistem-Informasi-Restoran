"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

interface UploadResult {
  success: boolean;
  url?: string;
  message?: string;
}

async function uploadFile(file: File, subfolder: "menu" | "bahan"): Promise<UploadResult> {
  if (!file || file.size === 0) {
    return { success: false, message: "File tidak ditemukan" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, message: "Format file harus JPG, PNG, atau WebP" };
  }

  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, message: "Ukuran file maksimal 2MB" };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return { success: true, url: `/uploads/${subfolder}/${fileName}` };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, message: "Gagal menyimpan file" };
  }
}

export async function uploadGambarMenu(formData: FormData): Promise<UploadResult> {
  const file = formData.get("gambar") as File;
  return uploadFile(file, "menu");
}

export async function uploadGambarBahan(formData: FormData): Promise<UploadResult> {
  const file = formData.get("gambar") as File;
  return uploadFile(file, "bahan");
}

export async function deleteGambarLama(url: string | undefined | null) {
  if (!url || !url.startsWith("/uploads/")) return;

  try {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath);
  } catch (error) {
    console.warn("Gagal menghapus file lama:", error);
  }
}