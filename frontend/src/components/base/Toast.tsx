import { useState, useEffect, useCallback } from "react";

export interface ToastData {
  id: string;
  message: string;
  subMessage?: string;
  type: "success" | "info" | "error";
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const duration = toast.duration ?? 3500;
    const timer = setTimeout(() => handleDismiss(), duration);
    return () => clearTimeout(timer);
  }, [handleDismiss, toast.duration]);

  const iconMap = {
    success: "ri-checkbox-circle-fill",
    info: "ri-information-fill",
    error: "ri-error-warning-fill",
  };

  const colorMap = {
    success: "text-accent-500",
    info: "text-primary-500",
    error: "text-accent-600",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      tabIndex={0}
      onClick={handleDismiss}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          e.preventDefault();
          handleDismiss();
        }
      }}
      className={`flex items-start gap-3 px-4 py-3 rounded-lg bg-background-50 border border-background-200/70 max-w-sm w-full cursor-pointer transition-all duration-300 ${
        visible && !exiting
          ? "translate-x-0 opacity-100"
          : "translate-x-6 opacity-0"
      }`}
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
    >
      <div className="shrink-0 mt-0.5">
        <i className={`${iconMap[toast.type]} ${colorMap[toast.type]} text-lg`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground-900 leading-snug">
          {toast.message}
        </p>
        {toast.subMessage && (
          <p className="text-xs text-foreground-500 mt-0.5 leading-snug">
            {toast.subMessage}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        aria-label="Dismiss notification"
        className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
      >
        <i className="ri-close-line text-sm"></i>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// Utility to generate a unique toast id
let idCounter = 0;
export function createToast(
  message: string,
  subMessage?: string,
  type: "success" | "info" | "error" = "success",
  duration?: number
): ToastData {
  idCounter += 1;
  return {
    id: `toast-${idCounter}-${Date.now()}`,
    message,
    subMessage,
    type,
    duration,
  };
}