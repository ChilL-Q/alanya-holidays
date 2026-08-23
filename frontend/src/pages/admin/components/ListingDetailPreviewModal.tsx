import React from "react";
import type { ModerationListing } from "@/api-services/admin.service";

interface ListingDetailPreviewModalProps {
  listing: ModerationListing | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onRequestReject?: (listing: ModerationListing) => void;
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
    label: "Pending Review",
  },
  rejected: {
    bg: "bg-rose-100 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800",
    text: "text-rose-800 dark:text-rose-300",
    label: "Rejected",
  },
  draft: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    text: "text-slate-800 dark:text-slate-300",
    label: "Draft",
  },
};

const tierBadgeConfig: Record<string, { bg: string; text: string; label: string }> = {
  explorer: {
    bg: "bg-secondary-100 dark:bg-slate-800",
    text: "text-secondary-800 dark:text-slate-300",
    label: "Explorer (Free)",
  },
  voyager: {
    bg: "bg-blue-100 dark:bg-blue-950/80",
    text: "text-blue-800 dark:text-blue-300",
    label: "Voyager (Growth)",
  },
  signature: {
    bg: "bg-amber-100 dark:bg-amber-950/80",
    text: "text-amber-800 dark:text-amber-300",
    label: "Signature",
  },
  partner: {
    bg: "bg-purple-100 dark:bg-purple-950/80",
    text: "text-purple-800 dark:text-purple-300",
    label: "Partner",
  },
};

export default function ListingDetailPreviewModal({
  listing,
  isOpen,
  onClose,
  onApprove,
  onRequestReject,
}: ListingDetailPreviewModalProps) {
  if (!isOpen || !listing) return null;

  const statusStyle = statusBadgeConfig[listing.status] || {
    bg: "bg-secondary-100 dark:bg-slate-800",
    text: "text-secondary-800 dark:text-slate-300",
    label: listing.status,
  };

  const tierStyle = tierBadgeConfig[listing.tier || "explorer"] || {
    bg: "bg-secondary-100 dark:bg-slate-800",
    text: "text-secondary-800 dark:text-slate-300",
    label: listing.tier || "Explorer",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-preview-title"
    >
      <div className="relative bg-white dark:bg-slate-900 text-secondary-900 dark:text-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-secondary-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text}`}
            >
              {statusStyle.label}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${tierStyle.bg} ${tierStyle.text}`}
            >
              {tierStyle.label}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Category */}
          <div>
            <h2
              id="listing-preview-title"
              className="text-2xl font-bold text-secondary-900 dark:text-white"
            >
              {listing.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-secondary-500 dark:text-slate-400 mt-1">
              <span className="capitalize font-medium text-secondary-700 dark:text-slate-300">
                <i className="ri-price-tag-3-line mr-1 text-accent-500" />
                {listing.category || listing.category_id || "Uncategorized"}
              </span>
              {listing.location && (
                <span>
                  <i className="ri-map-pin-line mr-1 text-rose-500" />
                  {listing.location}
                </span>
              )}
              {listing.created_at && (
                <span>
                  <i className="ri-time-line mr-1 text-secondary-400 dark:text-slate-500" />
                  Submitted {new Date(listing.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Rejection Notice if rejected */}
          {listing.status === "rejected" && listing.rejection_reason && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
              <div className="font-semibold flex items-center mb-1">
                <i className="ri-error-warning-line mr-1.5 text-rose-600" />
                Rejection Reason:
              </div>
              <p>{listing.rejection_reason}</p>
            </div>
          )}

          {/* Gallery */}
          {listing.gallery && listing.gallery.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 mb-2">
                Gallery Photos ({listing.gallery.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {listing.gallery.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-video rounded-xl overflow-hidden bg-secondary-100 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700"
                  >
                    <img
                      src={url}
                      alt={`${listing.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-secondary-50 dark:bg-slate-950 border border-dashed border-secondary-200 dark:border-slate-800 rounded-xl text-center text-xs text-secondary-400 dark:text-slate-500">
              No gallery images uploaded.
            </div>
          )}

          {/* Descriptions */}
          <div className="space-y-3">
            {listing.short_description && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 mb-1">
                  Short Tagline
                </h3>
                <p className="text-sm text-secondary-700 dark:text-slate-300 bg-secondary-50 dark:bg-slate-950 p-3 rounded-xl">
                  {listing.short_description}
                </p>
              </div>
            )}
            {listing.description && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 mb-1">
                  Full Description
                </h3>
                <div className="text-sm text-secondary-700 dark:text-slate-300 whitespace-pre-line bg-secondary-50 dark:bg-slate-950 p-4 rounded-xl leading-relaxed">
                  {listing.description}
                </div>
              </div>
            )}
          </div>

          {/* Contact & Links Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-400 dark:text-slate-500 mb-2">
              Contact & Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {listing.email && (
                <div className="p-3 bg-secondary-50 dark:bg-slate-950 rounded-xl flex items-center space-x-2">
                  <i className="ri-mail-line text-secondary-500 dark:text-slate-400" />
                  <span className="truncate">{listing.email}</span>
                </div>
              )}
              {listing.phone && (
                <div className="p-3 bg-secondary-50 dark:bg-slate-950 rounded-xl flex items-center space-x-2">
                  <i className="ri-phone-line text-secondary-500 dark:text-slate-400" />
                  <span>{listing.phone}</span>
                </div>
              )}
              {listing.whatsapp && (
                <div className="p-3 bg-secondary-50 dark:bg-slate-950 rounded-xl flex items-center space-x-2">
                  <i className="ri-whatsapp-line text-emerald-600 dark:text-emerald-400" />
                  <span>{listing.whatsapp}</span>
                </div>
              )}
              {listing.website && (
                <div className="p-3 bg-secondary-50 dark:bg-slate-950 rounded-xl flex items-center space-x-2 truncate">
                  <i className="ri-global-line text-blue-500 dark:text-blue-400" />
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 dark:text-accent-400 hover:underline truncate"
                  >
                    {listing.website}
                  </a>
                </div>
              )}
              {listing.google_map_url && (
                <div className="p-3 bg-secondary-50 dark:bg-slate-950 rounded-xl flex items-center space-x-2 truncate sm:col-span-2">
                  <i className="ri-map-2-line text-rose-500 dark:text-rose-400" />
                  <a
                    href={listing.google_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 dark:text-accent-400 hover:underline truncate text-xs"
                  >
                    {listing.google_map_url}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-2 text-xs text-secondary-400 dark:text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Listing ID: {listing.id}</span>
            {listing.owner_user_id && <span>Owner ID: {listing.owner_user_id}</span>}
            {listing.slug && <span>Slug: {listing.slug}</span>}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-secondary-100 dark:border-slate-800 bg-secondary-50 dark:bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary-700 dark:text-slate-300 hover:bg-secondary-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close Preview
          </button>
          <div className="flex items-center space-x-3">
            {onRequestReject && listing.status !== "rejected" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestReject(listing);
                }}
                className="px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="ri-close-circle-line" />
                <span>Reject</span>
              </button>
            )}
            {onApprove && listing.status !== "approved" && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApprove(listing.id);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <i className="ri-checkbox-circle-line" />
                <span>Approve Listing</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
