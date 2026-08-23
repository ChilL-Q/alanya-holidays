import { useState, useCallback } from "react";
import React from "react";
import ToastContainerComponent, { type ToastData, createToast } from "@/components/base/Toast";

export type { ToastData };

export interface UseToastReturn {
  toasts: ToastData[];
  showToast: (
    message: string,
    subMessage?: string,
    type?: "success" | "info" | "error",
    duration?: number
  ) => string;
  dismissToast: (id: string) => void;
  ToastContainer: React.FC;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      subMessage?: string,
      type: "success" | "info" | "error" = "success",
      duration?: number
    ) => {
      const newToast = createToast(message, subMessage, type, duration);
      setToasts((prev) => [...prev, newToast]);
      return newToast.id;
    },
    []
  );

  const ToastContainer = useCallback(() => {
    return <ToastContainerComponent toasts={toasts} onDismiss={dismissToast} />;
  }, [toasts, dismissToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    ToastContainer,
  };
}

export default useToast;
