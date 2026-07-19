"use client";

import { useEffect, useRef, useState } from "react";

export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number = 3000,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    async function poll() {
      try {
        const result = await fetchFnRef.current();
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }

    poll();
    const interval = setInterval(poll, intervalMs);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        poll();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [intervalMs, enabled]);

  return { data, isLoading };
}