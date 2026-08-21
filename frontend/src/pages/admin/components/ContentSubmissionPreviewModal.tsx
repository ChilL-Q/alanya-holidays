import React, { useState, useEffect } from "react";
import type { BlogSubmissionAdminItem } from "@/api-services/admin.service";

interface ContentSubmissionPreviewModalProps {
  isOpen: boolean;
  submission: BlogSubmissionAdminItem | null;
  onClose: () => void;
  onApprove: (id: string) => Promise<void> | void;
  onReject: (id: string, reason: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export default function ContentSubmissionPreviewModal({
  isOpen,
  submission,
  onClose,
  onApprove,
  onReject,
  isProcessing = false,
}: ContentSubmissionPreviewModalProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setShowRejectInput(false);
      setRejectReason("");
      setRejectError("");
    }
  }, [isOpen, submission]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !submission) return null;

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a rejection reason.");
      return;
    }
    onReject(submission.id, rejectReason.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "rejected":
        return "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "pending_review":
      default:
        return "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-preview-title"
    >
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-slate-800 overflow-hidden my-8 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-100 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300 flex items-center justify-center text-xl">
              <i className="ri-article-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusBadge(
                    submission.status
                  )}`}
                >
                  {submission.status}
                </span>
                {submission.category && (
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-secondary-100 text-secondary-700 dark:bg-slate-800 dark:text-slate-300">
                    {submission.category}
                  </span>
                )}
              </div>
              <h2
                id="submission-preview-title"
                className="text-xl font-bold text-secondary-900 dark:text-white mt-1"
              >
                {submission.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-secondary-400 hover:text-secondary-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close preview"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Creator & Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-secondary-50 dark:bg-slate-950 border border-secondary-100 dark:border-slate-800 text-sm">
            <div>
              <span className="text-xs font-medium text-secondary-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Creator / Author
              </span>
              <p className="font-semibold text-secondary-900 dark:text-white">
                {submission.author_name || submission.user?.full_name || "Anonymous Creator"}
              </p>
              <p className="text-xs text-secondary-600 dark:text-slate-300">
                {submission.author_email || submission.user?.email || "No email provided"}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-secondary-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Payout Details
              </span>
              {submission.payment_details ? (
                <div className="text-xs space-y-0.5 text-secondary-700 dark:text-slate-300">
                  <p>
                    <strong className="text-secondary-900 dark:text-white">Method:</strong>{" "}
                    {submission.payment_details.method?.toUpperCase()}
                  </p>
                  <p>
                    <strong className="text-secondary-900 dark:text-white">Account:</strong>{" "}
                    <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-secondary-200 dark:border-slate-700">
                      {submission.payment_details.handle}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-secondary-500 dark:text-slate-400 italic">No payout details provided</p>
              )}
            </div>
          </div>

          {/* Submission Story Content */}
          <div>
            <h3 className="text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Story / Content Text
            </h3>
            <div className="p-4 rounded-xl border border-secondary-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-secondary-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {submission.content}
            </div>
          </div>

          {/* Media Links / Video Preview */}
          {(submission.video_url || (submission.media_urls && submission.media_urls.length > 0)) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                Attached Media & Video
              </h3>
              {submission.video_url && (
                <div className="p-3 rounded-xl border border-secondary-200 dark:border-slate-800 bg-secondary-50 dark:bg-slate-950 flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate">
                    <i className="ri-video-line text-lg text-accent-600 dark:text-accent-400" />
                    <a
                      href={submission.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-accent-600 dark:text-accent-400 hover:underline truncate"
                    >
                      {submission.video_url}
                    </a>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300">
                    Video
                  </span>
                </div>
              )}

              {submission.media_urls && submission.media_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {submission.media_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-lg overflow-hidden border border-secondary-200 dark:border-slate-800 aspect-video bg-secondary-100 dark:bg-slate-800 flex items-center justify-center"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                        View Image
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rejection Reason Form */}
          {showRejectInput && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <label
                htmlFor="rejection-reason-input"
                className="block text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider"
              >
                Rejection Reason (Feedback for Creator) *
              </label>
              <textarea
                id="rejection-reason-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder="Enter reason for rejection (e.g., promotional spam, low resolution photos, not Alanya-focused)..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {rejectError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {rejectError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 text-xs font-medium text-secondary-600 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white rounded-lg hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {/* Existing Rejection Reason Display */}
          {submission.status === "rejected" && submission.rejection_reason && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block mb-1">
                Previous Rejection Reason:
              </span>
              <p className="text-xs text-rose-700 dark:text-rose-200">
                {submission.rejection_reason}
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between p-6 border-t border-secondary-100 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-600 dark:text-slate-300 hover:text-secondary-900 dark:hover:text-white rounded-xl hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {submission.status !== "rejected" && !showRejectInput && (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <i className="ri-close-circle-line" />
                <span>Reject Submission</span>
              </button>
            )}

            {submission.status !== "approved" && (
              <button
                type="button"
                onClick={() => onApprove(submission.id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                <i className="ri-check-line text-base" />
                <span>Approve & Publish</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
