"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useNewItemNotification<T>(
  items: T[],
  getId: (item: T) => number,
  soundUrl?: string
) {
  const knownIdsRef = useRef<Set<number> | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getIdRef = useRef(getId);
  getIdRef.current = getId;

  useEffect(() => {
    if (soundUrl && !audioRef.current) {
      audioRef.current = new Audio(soundUrl);
    }
  }, [soundUrl]);

  useEffect(() => {
    const currentIds = new Set(items.map((item) => getIdRef.current(item)));

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
        });
      }
    }

    knownIdsRef.current = currentIds;
  }, [items]);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return { toastMessage, dismissToast };
}