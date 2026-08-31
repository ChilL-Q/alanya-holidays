import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title?: string;
  itemName?: string;
}

export default function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
}: RejectReasonModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError(t("admin.rejectionReason"));
      return;
    }
    if (trimmed.length < 5) {
      setError(t("admin.rejectionMin"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmed);
      setReason("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.rejectionSubmitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div className="relative bg-white dark:bg-slate-900 text-secondary-900 dark:text-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-secondary-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 transition-colors">
        <div className="flex items-center justify-between pb-4 border-b border-secondary-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl">
              <i className="ri-error-warning-line" />
            </div>
            <div>
              <h3
                id="reject-modal-title"
                className="text-lg font-bold text-secondary-900 dark:text-white"
              >
                {title ?? t("admin.rejectListing")}
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400 line-clamp-1">
                {itemName ?? t("admin.thisItem")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary-400 dark:text-slate-500 hover:text-secondary-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="reject-reason-input"
              className="block text-sm font-semibold text-secondary-700 dark:text-slate-300 mb-1.5"
            >
              {t("admin.feedback")} <span className="text-rose-500">*</span>
            </label>
            <p className="text-xs text-secondary-500 dark:text-slate-400 mb-2">
              {t("admin.feedbackDescription")}
            </p>
            <textarea
              id="reject-reason-input"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t("admin.feedbackPlaceholder")}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-secondary-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-950 outline-none transition-all resize-none"
              required
            />
            <div className="flex justify-between text-xs text-secondary-400 dark:text-slate-500 mt-1">
              <span>{t("admin.minCharacters")}</span>
              <span>{reason.length}/1000</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <i className="ri-alert-line text-sm" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-secondary-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-slate-300 hover:bg-secondary-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 5}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-sm" />
                  <span>{t("admin.rejecting")}</span>
                </>
              ) : (
                <>
                  <i className="ri-close-circle-line text-sm" />
                  <span>{t("admin.confirmRejection")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
