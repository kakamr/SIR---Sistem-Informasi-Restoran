"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Membandingkan daftar ID sebelum dan sesudah polling.
 * Kalau ada ID baru yang belum pernah muncul sebelumnya, trigger notifikasi.
 */
export function useNewItemNotification<T>(
  items: T[],
  getId: (item: T) => number,
  soundUrl?: string
) {
  const knownIdsRef = useRef<Set<number> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (soundUrl && !audioRef.current) {
      audioRef.current = new Audio(soundUrl);
    }
  }, [soundUrl]);

  useEffect(() => {
    const currentIds = new Set(items.map(getId));

    // Pertama kali load, cuma catat ID yang ada - jangan trigger notifikasi
    // (supaya tidak notif untuk data yang sudah ada sejak halaman dibuka)
    if (knownIdsRef.current === null) {
      knownIdsRef.current = currentIds;
      return;
    }

    const newIds = [...currentIds].filter((id) => !knownIdsRef.current!.has(id));

    if (newIds.length > 0) {
      setToastMessage(
        newIds.length === 1 ? "1 pesanan baru masuk!" : `${newIds.length} pesanan baru masuk!`
      );

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // Browser kadang blokir autoplay sebelum ada interaksi user - abaikan errornya
        });
      }
    }

    knownIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function dismissToast() {
    setToastMessage(null);
  }

  return { toastMessage, dismissToast };
}