"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { generateQrDataUrl } from "@/lib/utils/generate-qr";
import { getMejaList } from "@/lib/actions/meja";

export async function generateKodeAksesMeja(idMeja: number) {
  try {
    const kode = randomBytes(6).toString("hex");
    await pool.query("UPDATE Meja SET kode_akses = ? WHERE id_meja = ?", [kode, idMeja]);
    revalidatePath("/qr-meja");
    return { success: true };
  } catch (error) {
    console.error("generateKodeAksesMeja error:", error);
    return { success: false, message: "Gagal generate kode akses" };
  }
}

export async function getQrCodeMejaList(baseUrl: string) {
  const mejaList = await getMejaList();

  const result = await Promise.all(
    mejaList.map(async (meja) => {
      if (!meja.kodeAkses) {
        return {
          idMeja: meja.idMeja,
          nomorMeja: meja.nomorMeja,
          kapasitas: meja.kapasitas,
          orderUrl: null,
          qrDataUrl: null,
        };
      }
      const orderUrl = `${baseUrl}/order/${meja.kodeAkses}`;
      const qrDataUrl = await generateQrDataUrl(orderUrl);
      return {
        idMeja: meja.idMeja,
        nomorMeja: meja.nomorMeja,
        kapasitas: meja.kapasitas,
        orderUrl,
        qrDataUrl,
      };
    })
  );

  return result;
}