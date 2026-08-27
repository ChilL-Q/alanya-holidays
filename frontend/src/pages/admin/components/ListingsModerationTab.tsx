import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  adminService,
  type ModerationListing,
} from "@/api-services/admin.service";
import ListingDetailPreviewModal from "./ListingDetailPreviewModal";
import RejectReasonModal from "./RejectReasonModal";
import BulkActionsToolbar from "./BulkActionsToolbar";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "draft";

interface ListingsModerationTabProps {
  onListingCountUpdate?: (counts: { total: number; pending: number }) => void;
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
    label: "Pending",
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
    label: "Explorer",
  },
  voyager: {
    bg: "bg-blue-100 dark:bg-blue-950/80",
    text: "text-blue-800 dark:text-blue-300",
    label: "Voyager",
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

const categoriesList = [
  { id: "all", label: "All Categories" },
  { id: "restaurants", label: "Restaurants & Dining" },
  { id: "activities", label: "Activities & Tours" },
  { id: "hotels", label: "Hotels & Stays" },
  { id: "wellness", label: "Wellness & Spa" },
  { id: "boat-tours", label: "Boat & Yacht Charters" },
  { id: "shopping", label: "Shopping & Retail" },
  { id: "services", label: "Local Services" },
];

export default function ListingsModerationTab({
  onListingCountUpdate,
}: ListingsModerationTabProps) {
  const [listings, setListings] = useState<ModerationListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);

  const onListingCountUpdateRef = React.useRef(onListingCountUpdate);
  useEffect(() => {
    onListingCountUpdateRef.current = onListingCountUpdate;
  }, [onListingCountUpdate]);

  // Modals
  const [previewListing, setPreviewListing] = useState<ModerationListing | null>(null);
  const [rejectingListing, setRejectingListing] = useState<ModerationListing | null>(null);

  const fetchListings = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await adminService.getModerationListings({
        status: statusFilter,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        query: searchQuery.trim() || undefined,
        throwOnError: true,
      });
      setListings(data || []);

      if (onListingCountUpdateRef.current) {
        const pendingCount = (data || []).filter((l) => l.status === "pending").length;
        onListingCountUpdateRef.current({ total: data?.length || 0, pending: pendingCount });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  useAutoRefresh(() => fetchListings(true), { intervalMs: 20000 });

  // Clear multi-selection when status filter, category, or search query changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, categoryFilter, searchQuery]);

  const filteredListings = useMemo(() => {
    let result = listings;
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter(
        (l) => l.category_id === categoryFilter || l.category === categoryFilter
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.location && l.location.toLowerCase().includes(q)) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.slug && l.slug.toLowerCase().includes(q))
      );
    }
    return result;
  }, [listings, statusFilter, categoryFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: listings.length,
      pending: listings.filter((l) => l.status === "pending").length,
      approved: listings.filter((l) => l.status === "approved").length,
      rejected: listings.filter((l) => l.status === "rejected").length,
      draft: listings.filter((l) => l.status === "draft").length,
    };
  }, [listings]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredListings.map((l) => l.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    filteredListings.length > 0 &&
    filteredListings.every((l) => selectedIds.has(l.id));

  // Single Action Handlers
  const handleApprove = async (id: string) => {
    setActionLoadingId(id);
    try {
      const ok = await adminService.approveListing(id);
      if (ok) {
        toast.success("Listing approved successfully");
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: "approved" } : l))
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Failed to approve listing");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingListing) return;
    const id = rejectingListing.id;
    setActionLoadingId(id);
    try {
      const ok = await adminService.rejectListing(id, reason);
      if (ok) {
        toast.success("Listing rejected with feedback");
        setListings((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, status: "rejected", rejection_reason: reason } : l
          )
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Failed to reject listing");
      }
    } finally {
      setActionLoadingId(null);
      setRejectingListing(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      return;
    }
    setActionLoadingId(id);
    try {
      const ok = await adminService.deleteListing(id);
      if (ok) {
        toast.success("Listing deleted");
        setListings((prev) => prev.filter((l) => l.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Failed to delete listing");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bulk Action Handlers
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    try {
      // Optimistic update
      setListings((prev) =>
        prev.map((l) => (selectedIds.has(l.id) ? { ...l, status: "approved" } : l))
      );

      const res = await adminService.batchApproveListings(ids);
      if (res.successful.length > 0) {
        toast.success(`Batch approved ${res.successful.length} listing(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to approve ${res.failed.length} listing(s)`);
        await fetchListings();
      }
      setSelectedIds(new Set());
    } catch {
      toast.error("Error during batch approval");
      await fetchListings();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleConfirmBatchReject = async (reason: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    try {
      // Optimistic update
      setListings((prev) =>
        prev.map((l) =>
          selectedIds.has(l.id)
            ? { ...l, status: "rejected", rejection_reason: reason }
            : l
        )
      );

      const res = await adminService.batchRejectListings(ids, reason);
      if (res.successful.length > 0) {
        toast.success(`Batch rejected ${res.successful.length} listing(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to reject ${res.failed.length} listing(s)`);
        await fetchListings();
      }
      setSelectedIds(new Set());
      setIsBulkRejectModalOpen(false);
    } catch {
      toast.error("Error during batch rejection");
      await fetchListings();
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Directory Curation Handlers (Task 2.2)
  const handleToggleFeature = async (id: string, nextFeatured: boolean) => {
    setActionLoadingId(id);
    const previous = listings.find((l) => l.id === id)?.is_featured;

    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_featured: nextFeatured } : l))
    );

    try {
      const ok = await adminService.toggleListingFeature(id, nextFeatured);
      if (ok) {
        toast.success(nextFeatured ? "Listing marked as featured" : "Listing unfeatured");
      } else {
        // Rollback
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_featured: previous } : l))
        );
        toast.error("Failed to update featured status");
      }
    } catch {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_featured: previous } : l))
      );
      toast.error("Network error while updating featured status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleVerify = async (id: string, nextVerified: boolean) => {
    setActionLoadingId(id);
    const previous = listings.find((l) => l.id === id)?.is_verified;

    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, is_verified: nextVerified } : l))
    );

    try {
      const ok = await adminService.toggleListingVerify(id, nextVerified);
      if (ok) {
        toast.success(nextVerified ? "Listing verified" : "Listing unverified");
      } else {
        // Rollback
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_verified: previous } : l))
        );
        toast.error("Failed to update verification status");
      }
    } catch {
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_verified: previous } : l))
      );
      toast.error("Network error while updating verification status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateScore = async (listing: ModerationListing) => {
    const currentScore = listing.base_score || 0;
    const input = window.prompt(
      `Enter curation base score (0 - 100) for "${listing.name}":`,
      String(currentScore)
    );
    if (input === null || input.trim() === "") return;

    const num = Number(input.trim());
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error("Score must be a number between 0 and 100");
      return;
    }

    setActionLoadingId(listing.id);
    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, base_score: num } : l))
    );

    try {
      const ok = await adminService.updateListingScore(listing.id, num);
      if (ok) {
        toast.success(`Score updated to ${num}`);
      } else {
        // Rollback
        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? { ...l, base_score: currentScore } : l))
        );
        toast.error("Failed to update listing score");
      }
    } catch {
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, base_score: currentScore } : l))
      );
      toast.error("Network error while updating score");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchFeature = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (selectedIds.has(l.id) ? { ...l, is_featured: true } : l))
    );

    try {
      const res = await adminService.batchFeatureListings(ids);
      if (res.successful.length > 0) {
        toast.success(`Batch featured ${res.successful.length} listing(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to feature ${res.failed.length} listing(s)`);
        await fetchListings();
      }
      setSelectedIds(new Set());
    } catch {
      toast.error("Error during batch feature");
      await fetchListings();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBatchVerify = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    // Optimistic update
    setListings((prev) =>
      prev.map((l) => (selectedIds.has(l.id) ? { ...l, is_verified: true } : l))
    );

    try {
      const res = await adminService.batchVerifyListings(ids);
      if (res.successful.length > 0) {
        toast.success(`Batch verified ${res.successful.length} listing(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to verify ${res.failed.length} listing(s)`);
        await fetchListings();
      }
      setSelectedIds(new Set());
    } catch {
      toast.error("Error during batch verify");
      await fetchListings();
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-secondary-200/80 dark:border-slate-800 space-y-4 transition-colors">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected", "draft"] as StatusFilter[]).map(
            (st) => {
              const isActive = statusFilter === st;
              const count = counts[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold capitalize transition-all cursor-pointer ${
                    isActive
                      ? "bg-secondary-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {st}
                  <span
                    className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      isActive
                        ? "bg-secondary-700 dark:bg-slate-300 text-secondary-100 dark:text-slate-900"
                        : "bg-white dark:bg-slate-700 text-secondary-500 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* Search & Category Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-slate-500 text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, location, email, or slug..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-secondary-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 dark:focus:ring-accent-950 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:text-slate-500 dark:hover:text-slate-300 text-base p-1"
              >
                <i className="ri-close-circle-fill" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-secondary-300 dark:border-slate-700 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 dark:focus:ring-accent-950 outline-none bg-white dark:bg-slate-900 text-secondary-700 dark:text-slate-200"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="ri-error-warning-line text-lg text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchListings}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-6 space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="animate-pulse flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-slate-800 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-100 dark:bg-slate-800 rounded-md w-1/3" />
                <div className="h-3 bg-secondary-100 dark:bg-slate-800 rounded-md w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-slate-800 text-secondary-400 dark:text-slate-500 flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-folder-open-line" />
          </div>
          <h3 className="text-base font-bold text-secondary-800 dark:text-white">
            No listings found
          </h3>
          <p className="text-sm text-secondary-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            No listings match the current filters. Try changing your search query or status filter.
          </p>
        </div>
      ) : (
        /* Listings Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-slate-800">
              <thead className="bg-secondary-50 dark:bg-slate-950">
                <tr>
                  <th className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all listings"
                      checked={isAllSelected}
                      onChange={(e) => {
                        if (e.target.checked) selectAllFiltered();
                        else deselectAll();
                      }}
                      className="w-4 h-4 rounded border-secondary-300 dark:border-slate-600 text-accent-600 focus:ring-accent-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Business / Listing
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Category & Tier
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {filteredListings.map((listing) => {
                  const statusStyle = statusBadgeConfig[listing.status] || {
                    bg: "bg-secondary-100 dark:bg-slate-800",
                    text: "text-secondary-800 dark:text-slate-200",
                    label: listing.status,
                  };
                  const tierStyle = tierBadgeConfig[listing.tier || "explorer"] || {
                    bg: "bg-secondary-100 dark:bg-slate-800",
                    text: "text-secondary-800 dark:text-slate-200",
                    label: listing.tier || "Explorer",
                  };
                  const thumbnail =
                    listing.gallery && listing.gallery.length > 0 ? listing.gallery[0] : null;

                  const isActionLoading = actionLoadingId === listing.id;
                  const isSelected = selectedIds.has(listing.id);

                  return (
                    <tr
                      key={listing.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-accent-50/40 dark:bg-accent-950/20"
                          : "hover:bg-secondary-50/70 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select ${listing.name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(listing.id)}
                          className="w-4 h-4 rounded border-secondary-300 dark:border-slate-600 text-accent-600 focus:ring-accent-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-secondary-400 dark:text-slate-500">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={listing.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <i className="ri-store-2-line text-xl" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <span className="font-semibold text-secondary-900 dark:text-white block truncate">
                              {listing.name}
                            </span>
                            <span className="text-xs text-secondary-500 dark:text-slate-400 block truncate">
                              {listing.location || "Alanya, Turkey"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-secondary-700 dark:text-slate-300 block capitalize">
                            {listing.category || listing.category_id || "Directory"}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold ${tierStyle.bg} ${tierStyle.text}`}
                          >
                            {tierStyle.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start space-y-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>
                          <button
                            type="button"
                            data-testid={`score-btn-${listing.id}`}
                            onClick={() => handleUpdateScore(listing)}
                            disabled={isActionLoading}
                            aria-label={`Score: ${listing.base_score || 0} for ${listing.name}`}
                            title={`Curation Base Score: ${listing.base_score || 0} / 100 (Click to edit)`}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 hover:border-accent-500 hover:text-accent-600 transition-colors cursor-pointer"
                          >
                            <span className="text-[10px] text-secondary-400 dark:text-slate-500 mr-1 font-normal">Score:</span>
                            <span>{listing.base_score || 0}</span>
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-secondary-500 dark:text-slate-400">
                        {listing.created_at
                          ? new Date(listing.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Feature toggle */}
                          <button
                            type="button"
                            data-testid={`feature-toggle-${listing.id}`}
                            onClick={() => handleToggleFeature(listing.id, !listing.is_featured)}
                            disabled={isActionLoading}
                            aria-label={listing.is_featured ? `Unfeature ${listing.name}` : `Feature ${listing.name}`}
                            title={listing.is_featured ? "Featured on Homepage / Category (Click to unfeature)" : "Not Featured (Click to feature)"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                              listing.is_featured
                                ? "text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                                : "text-secondary-400 dark:text-slate-500 hover:text-amber-500 hover:bg-amber-50/50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <i className={`text-lg ${listing.is_featured ? "ri-star-fill text-amber-500" : "ri-star-line"}`} />
                          </button>

                          {/* Verify toggle */}
                          <button
                            type="button"
                            data-testid={`verify-toggle-${listing.id}`}
                            onClick={() => handleToggleVerify(listing.id, !listing.is_verified)}
                            disabled={isActionLoading}
                            aria-label={listing.is_verified ? `Unverify ${listing.name}` : `Verify ${listing.name}`}
                            title={listing.is_verified ? "Verified Business Badge (Click to unverify)" : "Unverified (Click to verify)"}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
                              listing.is_verified
                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                                : "text-secondary-400 dark:text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <i className={`text-lg ${listing.is_verified ? "ri-checkbox-circle-fill text-blue-600 dark:text-blue-400" : "ri-checkbox-circle-line"}`} />
                          </button>

                          {/* Preview modal trigger */}
                          <button
                            type="button"
                            onClick={() => setPreviewListing(listing)}
                            title="Quick Preview"
                            className="p-1.5 text-secondary-500 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-eye-line text-lg" />
                          </button>

                          {/* One-click Approve */}
                          {listing.status !== "approved" && (
                            <button
                              type="button"
                              data-testid={`approve-listing-${listing.id}`}
                              onClick={() => handleApprove(listing.id)}
                              disabled={isActionLoading}
                              title="Approve Listing"
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <i className="ri-checkbox-circle-line text-lg" />
                            </button>
                          )}

                          {/* Reject */}
                          {listing.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => setRejectingListing(listing)}
                              disabled={isActionLoading}
                              title="Reject with Reason"
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <i className="ri-close-circle-line text-lg" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(listing.id, listing.name)}
                            disabled={isActionLoading}
                            title="Delete Listing"
                            className="p-1.5 text-secondary-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredListings.length}
        onSelectAll={selectAllFiltered}
        onDeselectAll={deselectAll}
        onBatchApprove={handleBatchApprove}
        onBatchReject={() => setIsBulkRejectModalOpen(true)}
        onBatchFeature={handleBatchFeature}
        onBatchVerify={handleBatchVerify}
        isLoading={isBulkLoading}
        itemLabel="listings"
        approveLabel="Approve Selected"
        rejectLabel="Reject Selected"
        featureLabel="Feature Selected"
        verifyLabel="Verify Selected"
      />

      {/* Preview Modal */}
      <ListingDetailPreviewModal
        listing={previewListing}
        isOpen={Boolean(previewListing)}
        onClose={() => setPreviewListing(null)}
        onApprove={handleApprove}
        onRequestReject={(l) => setRejectingListing(l)}
      />

      {/* Single Reject Reason Modal */}
      <RejectReasonModal
        isOpen={Boolean(rejectingListing)}
        onClose={() => setRejectingListing(null)}
        onConfirm={handleConfirmReject}
        title="Reject Directory Listing"
        itemName={rejectingListing?.name || "this listing"}
      />

      {/* Bulk Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => setIsBulkRejectModalOpen(false)}
        onConfirm={handleConfirmBatchReject}
        title="Batch Reject Listings"
        itemName={`${selectedIds.size} selected listings`}
      />
    </div>
  );
}
