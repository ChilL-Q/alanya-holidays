import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  Building2,
  Sparkles,
  Edit,
  PlayCircle,
  Trash2,
  ExternalLink,
  Star,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Zap,
  Search,
  X,
  Compass,
} from "lucide-react";
import type { Business } from "@/api-services/directory.service";

export interface MyListingsTabProps {
  listings: Business[];
  loading: boolean;
  onEditListing: (listing: Business) => void;
  onResumeDraft: (draft: Business) => void;
  onDeleteListing: (listingId: string) => void;
  onUpgradeTier: (listing: Business) => void;
  onListNewBusiness?: () => void;
  filter?: string;
  onFilterChange?: (filter: string) => void;
  deletingListingId?: string | null;
}

// Status normalization helpers to handle common status aliases safely
const isLiveStatus = (status?: string) => {
  const s = status?.toLowerCase() || "approved";
  return s === "approved" || s === "active" || s === "verified" || s === "published";
};

const isPendingStatus = (status?: string) => {
  const s = status?.toLowerCase();
  return s === "pending" || s === "in_review" || s === "in review" || s === "submitted";
};

const isDraftStatus = (status?: string) => {
  const s = status?.toLowerCase();
  return s === "draft" || s === "drafts";
};

const isRejectedStatus = (status?: string) => {
  const s = status?.toLowerCase();
  return s === "rejected" || s === "declined" || s === "needs_revision" || s === "needs revision";
};

export const MyListingsTab: React.FC<MyListingsTabProps> = ({
  listings,
  loading,
  onEditListing,
  onResumeDraft,
  onDeleteListing,
  onUpgradeTier,
  onListNewBusiness,
  filter: externalFilter,
  onFilterChange,
  deletingListingId = null,
}) => {
  const [internalFilter, setInternalFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listingPendingDelete, setListingPendingDelete] = useState<Business | null>(null);

  const activeFilter = externalFilter !== undefined ? externalFilter : internalFilter;

  const handleFilterSelect = (newFilter: string) => {
    if (onFilterChange) {
      onFilterChange(newFilter);
    } else {
      setInternalFilter(newFilter);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    handleFilterSelect("all");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse space-y-4"
          >
            <div className="h-40 bg-secondary-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-6 bg-secondary-200 dark:bg-slate-800 rounded-md w-2/3" />
            <div className="h-4 bg-secondary-100 dark:bg-slate-800/60 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Count by status before search filter (gives user full category overview)
  const countByStatus = {
    all: listings.length,
    active: listings.filter((l) => isLiveStatus(l.status)).length,
    pending: listings.filter((l) => isPendingStatus(l.status)).length,
    draft: listings.filter((l) => isDraftStatus(l.status)).length,
    rejected: listings.filter((l) => isRejectedStatus(l.status)).length,
  };

  // Filter listings by status AND search query
  const filteredListings = listings.filter((item) => {
    let matchesStatus = true;
    if (activeFilter === "active" || activeFilter === "approved") matchesStatus = isLiveStatus(item.status);
    else if (activeFilter === "pending" || activeFilter === "in_review" || activeFilter === "in review") matchesStatus = isPendingStatus(item.status);
    else if (activeFilter === "draft" || activeFilter === "drafts") matchesStatus = isDraftStatus(item.status);
    else if (activeFilter === "rejected") matchesStatus = isRejectedStatus(item.status);

    if (!matchesStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const rawTitle = (item as unknown as { title?: string }).title;
      const matchesName =
        typeof item.name === "string"
          ? item.name.toLowerCase().includes(q)
          : typeof rawTitle === "string"
          ? rawTitle.toLowerCase().includes(q)
          : false;
      const matchesCategory = typeof item.category === "string" ? item.category.toLowerCase().includes(q) : false;
      const matchesSubcategory = typeof item.subcategory === "string" ? item.subcategory.toLowerCase().includes(q) : false;
      const matchesAddress = typeof item.address === "string" ? item.address.toLowerCase().includes(q) : false;
      const matchesDescription = typeof item.description === "string" ? item.description.toLowerCase().includes(q) : false;
      return matchesName || matchesCategory || matchesSubcategory || matchesAddress || matchesDescription;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter & Live Search Matrix */}
      {listings.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-secondary-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search listings by title or category..."
                aria-label="Search listings by title or category"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="p-1 rounded-full text-secondary-400 hover:text-secondary-700 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Create New Listing Button */}
            {onListNewBusiness && (
              <button
                type="button"
                onClick={onListNewBusiness}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/15 cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Listing / Draft</span>
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Items", count: countByStatus.all },
              { id: "active", label: "Active", count: countByStatus.active },
              { id: "pending", label: "In Review", count: countByStatus.pending },
              { id: "draft", label: "Drafts", count: countByStatus.draft },
              { id: "rejected", label: "Rejected", count: countByStatus.rejected },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={activeFilter === f.id}
                onClick={() => handleFilterSelect(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
                  activeFilter === f.id
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 text-secondary-600 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeFilter === f.id
                      ? "bg-slate-950/20 text-slate-950"
                      : "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Rendering: Empty State vs Filtered Empty State vs Grid */}
      {listings.length === 0 ? (
        /* R4. Rich Onboarding & Guided Empty State (0 listings total) */
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm text-center space-y-8">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Building className="w-3.5 h-3.5" />
              <span>No businesses or drafts found</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-secondary-900 dark:text-white tracking-tight">
              Start Listing Your Alanya Business
            </h2>
            <p className="text-sm text-secondary-500 dark:text-slate-400 leading-relaxed">
              Connect with thousands of visitors looking for hotels, dining, yacht tours, wellness, and local services in Alanya. Publish your business in 3 quick steps:
            </p>
          </div>

          {/* 3 Quick Steps Onboarding Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto text-left">
            <div className="p-5 rounded-2xl bg-secondary-50 dark:bg-slate-800/60 border border-secondary-200/60 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <Building className="w-5 h-5 text-secondary-400" />
              </div>
              <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
                1. Business Details
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400">
                Provide your business title, category, contact phone, website, and neighborhood address in Alanya.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary-50 dark:bg-slate-800/60 border border-secondary-200/60 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <Sparkles className="w-5 h-5 text-secondary-400" />
              </div>
              <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
                2. Photos & Tier Perks
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400">
                Upload showcase gallery photos, select price ranges, and pick your preferred merchant visibility tier.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary-50 dark:bg-slate-800/60 border border-secondary-200/60 dark:border-slate-700/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <CheckCircle2 className="w-5 h-5 text-secondary-400" />
              </div>
              <h3 className="text-sm font-bold text-secondary-900 dark:text-white">
                3. Publish & Receive Leads
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400">
                Submit your listing live, get verified, and start receiving direct customer calls and WhatsApp inquiries.
              </p>
            </div>
          </div>

          {/* Dual CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            {onListNewBusiness && (
              <button
                type="button"
                onClick={onListNewBusiness}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ List Your Business Now</span>
              </button>
            )}

            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors"
            >
              <Compass className="w-4 h-4 text-amber-500" />
              <span>← Explore Directory / Вернуться на главную</span>
            </Link>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        /* Search/Filter Empty State (when search or filter chip produces 0 results) */
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Building className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
              No businesses or drafts found
            </h3>
            <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
              {searchQuery
                ? `No listings match your search for "${searchQuery}" in the '${activeFilter}' filter.`
                : `No items match the '${activeFilter}' status filter.`}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <span>Clear Search & Filters</span>
            </button>
            {onListNewBusiness && (
              <button
                type="button"
                onClick={onListNewBusiness}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ List New Business</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Listings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredListings.map((listing) => {
            const isDraft = isDraftStatus(listing.status);
            const isPending = isPendingStatus(listing.status);
            const isApproved = isLiveStatus(listing.status);
            const isRejected = isRejectedStatus(listing.status);
            const isDeleting = deletingListingId === listing.id;

            const tier = (listing as unknown as { tier?: string }).tier || "explorer";
            const isSignature = tier === "signature";
            const isPartner = tier === "partner";
            const displayName =
              typeof listing.name === "string"
                ? listing.name
                : typeof (listing as unknown as { title?: string }).title === "string"
                ? ((listing as unknown as { title?: string }).title as string)
                : "Business Listing";

            return (
              <div
                key={listing.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image & Header */}
                  <div className="relative h-44 sm:h-48 w-full bg-slate-900 overflow-hidden">
                    <img
                      src={listing.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"}
                      alt={listing.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Status & Tier Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Live & Active
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/90 text-slate-950 shadow-sm backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800/90 text-amber-300 border border-amber-400/40 shadow-sm backdrop-blur-sm">
                          <FileText className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600/90 text-white shadow-sm backdrop-blur-sm">
                          <XCircle className="w-3 h-3" />
                          Needs Revision
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-950/80 text-amber-300 border border-white/10 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {tier}
                      </span>
                    </div>

                    {/* Title in Image Bottom */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold font-display text-white truncate">
                        {typeof listing.name === "string"
                          ? listing.name
                          : typeof (listing as unknown as { title?: string }).title === "string"
                          ? (listing as unknown as { title?: string }).title
                          : "Business Listing"}
                      </h3>
                      <p className="text-xs text-slate-300 truncate">
                        {typeof listing.address === "string" ? listing.address : ""}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-secondary-600 dark:text-slate-400 line-clamp-2">
                      {typeof listing.description === "string" ? listing.description : "No description provided."}
                    </p>

                    {/* Quick performance metrics */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-secondary-50 dark:bg-slate-800/50 border border-secondary-100 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-secondary-400 dark:text-slate-400 block">Rating</span>
                        <span className="text-xs font-bold text-secondary-900 dark:text-white flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {typeof listing.rating === "number" || typeof listing.rating === "string"
                            ? listing.rating
                            : "5.0"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-secondary-400 dark:text-slate-400 block">Reviews</span>
                        <span className="text-xs font-bold text-secondary-900 dark:text-white">
                          {typeof listing.reviewCount === "number" ? listing.reviewCount : 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-secondary-400 dark:text-slate-400 block">Category</span>
                        <span className="text-xs font-bold text-secondary-900 dark:text-white truncate block">
                          {typeof listing.category === "string" ? listing.category : "General"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 pt-0 border-t border-secondary-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => onResumeDraft(listing)}
                        aria-label={`Resume draft for ${displayName}`}
                        title={`Resume draft for ${displayName}`}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Resume Draft</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditListing(listing)}
                          aria-label={`Edit ${displayName}`}
                          title={`Edit ${displayName}`}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <Link
                          to={`/business/${listing.id}`}
                          aria-label={`View live listing for ${displayName}`}
                          title={`View live listing for ${displayName}`}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${isDeleting ? "pointer-events-none opacity-60" : ""}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </>
                    )}

                    {!isSignature && !isPartner && (
                      <button
                        type="button"
                        onClick={() => onUpgradeTier(listing)}
                        aria-label={`Upgrade tier for ${displayName}`}
                        title={`Upgrade tier for ${displayName}`}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Upgrade</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setListingPendingDelete(listing)}
                    aria-label={isDeleting ? `Deleting ${displayName}` : `Delete ${displayName}`}
                    title={isDeleting ? `Deleting ${displayName}` : `Delete ${displayName}`}
                    disabled={isDeleting}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    {isDeleting ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-rose-300 border-t-rose-500 animate-spin" />
                        <span className="hidden sm:inline">Deleting...</span>
                      </span>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {listingPendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-listing-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-3.5 h-3.5" />
                Confirm deletion
              </div>
              <h3
                id="delete-listing-dialog-title"
                className="text-lg font-bold text-secondary-900 dark:text-white"
              >
                Delete this listing?
              </h3>
              <p className="text-sm text-secondary-500 dark:text-slate-400 leading-relaxed">
                You are about to remove <strong className="text-secondary-900 dark:text-white">{listingPendingDelete.name || "this listing"}</strong> from your dashboard. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setListingPendingDelete(null)}
                disabled={deletingListingId === listingPendingDelete.id}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-secondary-100 hover:bg-secondary-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-secondary-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void onDeleteListing(listingPendingDelete.id);
                  setListingPendingDelete(null);
                }}
                disabled={deletingListingId === listingPendingDelete.id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
