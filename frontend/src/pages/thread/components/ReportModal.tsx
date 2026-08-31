import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "@/i18n";

export interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export default function ReportModal({ isOpen, onClose, onSubmit }: ReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-background-200/80 w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-background-100 bg-background-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-flag-line text-lg"></i>
            </div>
            <h3 id="report-modal-title" className="font-heading font-semibold text-base text-foreground-900">
              {t("public.reportContent")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-foreground-400 hover:text-foreground-600 p-1.5 rounded-lg hover:bg-background-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label={t("common.close")}
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="report-reason" className="block text-xs font-medium text-foreground-700 mb-1.5">
              {t("public.reportReason")} <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="report-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("public.reportPlaceholder")}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-lg border border-background-200 bg-background-50/30 text-foreground-900 text-sm placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none transition-all disabled:opacity-60"
              required
              autoFocus
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-background-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-background-200 text-xs font-medium text-foreground-600 hover:bg-background-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm"></i>
                  <span>{t("public.sending")}</span>
                </>
              ) : (
                <>
                  <i className="ri-flag-fill text-sm"></i>
                  <span>{t("public.submitReport")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
