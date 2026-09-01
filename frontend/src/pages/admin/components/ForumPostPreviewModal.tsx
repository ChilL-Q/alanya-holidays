import React, { useState } from "react";
import type { ForumReportAdminItem } from "@/api-services/admin.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface ForumPostPreviewModalProps {
  report: ForumReportAdminItem | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (reportId: string) => Promise<boolean | void>;
  onToggleRemove: (
    targetType: "post" | "comment",
    targetId: string,
    willBeRemoved: boolean
  ) => Promise<boolean | void>;
  onTogglePin?: (postId: string, willBePinned: boolean) => Promise<boolean | void>;
  onDelete?: (
    targetType: "post" | "comment",
    targetId: string
  ) => Promise<boolean | void>;
}

export default function ForumPostPreviewModal({
  report,
  isOpen,
  onClose,
  onResolve,
  onToggleRemove,
  onTogglePin,
  onDelete,
}: ForumPostPreviewModalProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !report) return null;

  const isPost = report.target_type === "post";
  const targetMissing = report.target_missing === true;
  const post = report.target_post;
  const comment = report.target_comment;

  const contentTitle = isPost ? post?.title : undefined;
  const contentBody = targetMissing
    ? `This ${report.target_type} is no longer available. The report is retained for moderation history.`
    : isPost
      ? post?.content || t("admin.noPostBody")
      : comment?.body || t("admin.noCommentText");

  const isRemoved = isPost
    ? post?.is_removed === true
    : comment?.is_removed === true;
  const isPinned = isPost && post?.is_pinned === true;

  const handleResolve = async () => {
    setSubmitting(true);
    try {
      if ((await onResolve(report.id)) !== false) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRemove = async () => {
    setSubmitting(true);
    try {
      await onToggleRemove(
        report.target_type as "post" | "comment",
        report.target_id,
        !isRemoved
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!isPost || !onTogglePin) return;
    setSubmitting(true);
    try {
      await onTogglePin(report.target_id, !isPinned);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setSubmitting(true);
    try {
      if ((await onDelete(report.target_type as "post" | "comment", report.target_id)) !== false) {
        onClose();
      }
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-950/60 text-accent-700 dark:text-accent-400 flex items-center justify-center text-lg">
              <i className="ri-shield-user-line" />
            </div>
            <div>
              <h3
                id="preview-modal-title"
                className="text-lg font-bold text-secondary-900 dark:text-white"
              >
                {t("admin.reportInspection")}
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400">
                {t("admin.target")}:{" "}
                <span className="font-semibold uppercase text-accent-600 dark:text-accent-400">
                  {report.target_type}
                </span>{" "}
                • {t("admin.reportedOn", { date: new Date(report.created_at).toLocaleDateString() })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="text-secondary-400 hover:text-secondary-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Report Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-secondary-50 dark:bg-slate-800/60 border border-secondary-200/70 dark:border-slate-700/60 mb-4 text-xs">
          <div>
            <span className="text-secondary-500 dark:text-slate-400 block">
              {t("admin.reporter")}:
            </span>
            <span className="font-semibold text-secondary-900 dark:text-white">
              {report.reporter?.full_name || report.reporter_id || t("admin.anonymousUser")}
            </span>
          </div>
          <div>
            <span className="text-secondary-500 dark:text-slate-400 block">
              {t("admin.flagReason")}:
            </span>
            <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full font-bold uppercase text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {report.reason}
            </span>
          </div>
          <div>
            <span className="text-secondary-500 dark:text-slate-400 block">
              {t("admin.reportStatus")}:
            </span>
            <span
              className={`font-semibold ${
                report.resolved
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {report.resolved ? t("admin.resolved") : t("admin.pendingAction")}
            </span>
          </div>
          <div>
            <span className="text-secondary-500 dark:text-slate-400 block">
              {t("admin.contentVisibility")}:
            </span>
            <span
              className={`font-semibold ${
                targetMissing || isRemoved
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {targetMissing
                ? "Permanently deleted"
                : isRemoved
                  ? t("admin.softRemoved")
                  : t("admin.publiclyVisible")}
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
            {t("admin.reportedContent")}:
          </label>
          <div className="p-4 rounded-xl border border-secondary-200 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950 text-sm text-secondary-800 dark:text-slate-200 max-h-56 overflow-y-auto space-y-2">
            {contentTitle && (
              <h4 className="font-bold text-secondary-900 dark:text-white text-base">
                {contentTitle}
              </h4>
            )}
            <p className="whitespace-pre-wrap leading-relaxed">{contentBody}</p>
          </div>
        </div>

        {/* Moderation Controls / Actions */}
        {confirmDelete ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              {t("admin.permanentlyDelete", { target: report.target_type })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary-200 dark:bg-slate-700 text-secondary-800 dark:text-slate-200 hover:bg-secondary-300 transition-colors cursor-pointer"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {submitting ? t("admin.deleting") : t("admin.confirmDelete")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Soft Remove / Restore */}
              {!targetMissing && <button
                type="button"
                disabled={submitting}
                onClick={handleToggleRemove}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isRemoved
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100"
                }`}
              >
                <i className={isRemoved ? "ri-restart-line" : "ri-eye-off-line"} />
                <span>
                  {isRemoved
                    ? t(isPost ? "admin.restorePost" : "admin.restoreComment")
                    : t(isPost ? "admin.removePost" : "admin.removeComment")}
                </span>
              </button>}

              {/* Pin / Unpin (Post only) */}
              {!targetMissing && isPost && onTogglePin && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleTogglePin}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isPinned
                      ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-100"
                      : "bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 border-secondary-300 dark:border-slate-700 hover:bg-secondary-200"
                  }`}
                >
                  <i className="ri-pushpin-line" />
                  <span>{isPinned ? t("admin.unpinTopic") : t("admin.pinTopic")}</span>
                </button>
              )}

              {/* Hard Delete Trigger */}
              {!targetMissing && onDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="ri-delete-bin-line" />
                  <span>{t("admin.hardDelete")}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-secondary-300 dark:border-slate-700 text-secondary-700 dark:text-slate-300 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t("common.close")}
              </button>
              {!report.resolved && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResolve}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-accent-600 hover:bg-accent-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="ri-check-line text-sm" />
                  <span>{submitting ? t("admin.resolving") : t("admin.markAsResolved")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
