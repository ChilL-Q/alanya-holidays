import { useEffect, useRef } from "react";

interface UseAutoRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
}

export function useAutoRefresh(
  callback: () => Promise<void> | void,
  options: UseAutoRefreshOptions = {}
) {
  const { enabled = true, intervalMs = 30000 } = options;
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const runRefresh = async () => {
      if (inFlightRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    const handleFocus = () => {
      void runRefresh();
    };

    const intervalId = window.setInterval(() => {
      void runRefresh();
    }, intervalMs);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, intervalMs]);
}
