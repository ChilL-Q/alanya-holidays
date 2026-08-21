import React from "react";
import type { DirectoryClaim } from "@/api-services/admin.service";

interface ClaimDetailModalProps {
  claim: DirectoryClaim | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (claimId: string) => void;
  onRequestReject?: (claim: DirectoryClaim) => void;
}

const statusBadgeConfig: Record<string, { bg: string; text: string; label: string }> = {
  approved: {
    bg: "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    label: "Approved",
  },
  pending: {
    bg: "bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    label: "Pending Verification",
  },
  rejected: {
    bg: "bg-rose-100 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800",
    text: "text-rose-800 dark:text-rose-300",
    label: "Rejected",
  },
};

export default function ClaimDetailModal({
  claim,
  isOpen,
  onClose,
  onApprove,
  onRequestReject,
}: ClaimDetailModalProps) {
  if (!isOpen || !claim) return null;

  const statusStyle = statusBadgeConfig[claim.status] || {
    bg: "bg-secondary-100 dark:bg-slate-800",
    text: "text-secondary-800 dark:text-slate-300",
    label: claim.status,
  };

  const isEmailVerified = !claim.verification_token;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-detail-title"
    >
      <div className="relative bg-white dark:bg-slate-900 text-secondary-900 dark:text-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-secondary-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                isEmailVerified
                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              }`}
            >
              {isEmailVerified ? "Email Verified" : "Email Unverified"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary-400 dark:text-slate-500 hover:text-secondary-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-secondary-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500">
              Claimant Business Name
            </span>
            <h2
              id="claim-detail-title"
              className="text-2xl font-bold text-secondary-900 dark:text-white"
            >
              {claim.business_name}
            </h2>
            {claim.created_at && (
              <p className="text-xs text-secondary-400 dark:text-slate-500 mt-1">
                Submitted on {new Date(claim.created_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Rejection notice if rejected */}
          {claim.status === "rejected" && claim.rejection_reason && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
              <div className="font-semibold flex items-center mb-1">
                <i className="ri-error-warning-line mr-1.5 text-rose-600" />
                Rejection Reason:
              </div>
              <p>{claim.rejection_reason}</p>
            </div>
          )}

          {/* Claimant Information */}
          <div className="bg-secondary-50 dark:bg-slate-950 p-4 rounded-xl border border-secondary-200/60 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-600 dark:text-slate-300">
              Claimant Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-secondary-400 dark:text-slate-500 block">Role in Business</span>
                <span className="font-semibold text-secondary-800 dark:text-slate-200">{claim.role || "Owner"}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-400 dark:text-slate-500 block">Claimant User ID</span>
                <span className="font-mono text-xs text-secondary-700 dark:text-slate-300 truncate block">
                  {claim.user_id}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary-400 dark:text-slate-500 block">Email Address</span>
                <span className="text-secondary-800 dark:text-slate-200">{claim.email}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-400 dark:text-slate-500 block">Contact Phone</span>
                <span className="text-secondary-800 dark:text-slate-200">{claim.phone || claim.contact_phone}</span>
              </div>
            </div>
          </div>

          {/* Target Listing Details */}
          {claim.directory_listing && (
            <div className="bg-primary-50/50 dark:bg-primary-950/30 p-4 rounded-xl border border-primary-200/50 dark:border-primary-800/50 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-300">
                Target Listing Link
              </h3>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-secondary-900 dark:text-white block">
                    {claim.directory_listing.name || "Target Listing"}
                  </span>
                  <span className="text-xs text-secondary-500 dark:text-slate-400 capitalize">
                    {claim.directory_listing.category_id || "Category"} • Tier:{" "}
                    {claim.directory_listing.tier || "Explorer"}
                  </span>
                </div>
                {claim.directory_listing.slug && (
                  <a
                    href={`/directory/${claim.directory_listing.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-accent-200 dark:border-accent-800 shadow-2xs"
                  >
                    View Listing <i className="ri-external-link-line ml-1" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 mb-1.5">
              Verification Notes & Proof
            </h3>
            <div className="p-4 bg-secondary-50 dark:bg-slate-950 border border-secondary-200/60 dark:border-slate-800 rounded-xl text-sm text-secondary-700 dark:text-slate-300 whitespace-pre-line">
              {claim.additional_notes ||
                claim.description ||
                "No additional notes provided with this claim submission."}
            </div>
          </div>

          {/* Extra contact details */}
          {(claim.whatsapp || claim.website || claim.address) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-secondary-600 dark:text-slate-400">
              {claim.whatsapp && <div>WhatsApp: {claim.whatsapp}</div>}
              {claim.website && <div>Website: {claim.website}</div>}
              {claim.address && <div className="sm:col-span-2">Address: {claim.address}</div>}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-secondary-100 dark:border-slate-800 bg-secondary-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-slate-300 hover:bg-secondary-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center space-x-3">
            {onRequestReject && claim.status !== "rejected" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestReject(claim);
                }}
                className="px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="ri-close-circle-line" />
                <span>Reject Claim</span>
              </button>
            )}
            {onApprove && claim.status !== "approved" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(claim.id);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="ri-shield-check-line" />
                <span>Approve & Transfer Ownership</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
