import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import {
  adminService,
  type DirectoryClaim,
} from "@/api-services/admin.service";
import ClaimDetailModal from "./ClaimDetailModal";
import RejectReasonModal from "./RejectReasonModal";
import BulkActionsToolbar from "./BulkActionsToolbar";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

type ClaimStatusFilter = "all" | "pending" | "approved" | "rejected";

interface ClaimsQueueTabProps {
  onClaimCountUpdate?: (counts: { total: number; pending: number }) => void;
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
};

export default function ClaimsQueueTab({
  onClaimCountUpdate,
}: ClaimsQueueTabProps) {
  const [claims, setClaims] = useState<DirectoryClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);

  const onClaimCountUpdateRef = React.useRef(onClaimCountUpdate);
  useEffect(() => {
    onClaimCountUpdateRef.current = onClaimCountUpdate;
  }, [onClaimCountUpdate]);

  // Modals
  const [detailClaim, setDetailClaim] = useState<DirectoryClaim | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<DirectoryClaim | null>(null);

  const fetchClaims = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const data = await adminService.getClaimsQueue(
        statusFilter !== "all" ? statusFilter : undefined,
        { throwOnError: true }
      );
      setClaims(data || []);

      if (onClaimCountUpdateRef.current) {
        const pending = (data || []).filter((c) => c.status === "pending").length;
        onClaimCountUpdateRef.current({ total: data?.length || 0, pending });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims queue");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchClaims();
  }, [fetchClaims]);

  useAutoRefresh(() => fetchClaims(true), { intervalMs: 20000 });

  // Clear selection on filter or search query change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, searchQuery]);

  const filteredClaims = useMemo(() => {
    let result = claims;
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.business_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          (c.directory_listing?.name &&
            c.directory_listing.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [claims, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: claims.length,
      pending: claims.filter((c) => c.status === "pending").length,
      approved: claims.filter((c) => c.status === "approved").length,
      rejected: claims.filter((c) => c.status === "rejected").length,
    };
  }, [claims]);

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
    setSelectedIds(new Set(filteredClaims.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    filteredClaims.length > 0 &&
    filteredClaims.every((c) => selectedIds.has(c.id));

  // Single Action Handlers
  const handleApproveClaim = async (claimId: string) => {
    setActionLoadingId(claimId);
    try {
      const ok = await adminService.approveClaim(claimId);
      if (ok) {
        toast.success("Claim approved and business ownership transferred!");
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: "approved" } : c))
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(claimId);
          return next;
        });
      } else {
        toast.error("Failed to approve claim");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingClaim) return;
    const id = rejectingClaim.id;
    setActionLoadingId(id);
    try {
      const ok = await adminService.rejectClaim(id, reason);
      if (ok) {
        toast.success("Claim rejected with feedback sent to claimant");
        setClaims((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: "rejected", rejection_reason: reason } : c
          )
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Failed to reject claim");
      }
    } finally {
      setActionLoadingId(null);
      setRejectingClaim(null);
    }
  };

  // Bulk Action Handlers
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    try {
      // Optimistic update
      setClaims((prev) =>
        prev.map((c) => (selectedIds.has(c.id) ? { ...c, status: "approved" } : c))
      );

      const res = await adminService.batchApproveClaims(ids);
      if (res.successful.length > 0) {
        toast.success(`Batch approved ${res.successful.length} claim(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to approve ${res.failed.length} claim(s)`);
        await fetchClaims();
      }
      setSelectedIds(new Set());
    } catch {
      toast.error("Error during batch approval");
      await fetchClaims();
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
      setClaims((prev) =>
        prev.map((c) =>
          selectedIds.has(c.id)
            ? { ...c, status: "rejected", rejection_reason: reason }
            : c
        )
      );

      const res = await adminService.batchRejectClaims(ids, reason);
      if (res.successful.length > 0) {
        toast.success(`Batch rejected ${res.successful.length} claim(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to reject ${res.failed.length} claim(s)`);
        await fetchClaims();
      }
      setSelectedIds(new Set());
      setIsBulkRejectModalOpen(false);
    } catch {
      toast.error("Error during batch rejection");
      await fetchClaims();
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-secondary-200/80 dark:border-slate-800 space-y-4 transition-colors">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as ClaimStatusFilter[]).map(
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

        <div className="relative">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-slate-500 text-base" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims by business name, claimant email, phone, or role..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-secondary-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-950 outline-none transition-all"
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
            onClick={() => {
              void fetchClaims();
            }}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-6 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse flex items-center space-x-4">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-slate-800 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-secondary-100 dark:bg-slate-800 rounded-md w-1/3" />
                <div className="h-3 bg-secondary-100 dark:bg-slate-800 rounded-md w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary-100 dark:bg-slate-800 text-secondary-400 dark:text-slate-500 flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-shield-check-line" />
          </div>
          <h3 className="text-base font-bold text-secondary-800 dark:text-white">
            No ownership claims
          </h3>
          <p className="text-sm text-secondary-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            There are currently no ownership claims matching your selected status filter.
          </p>
        </div>
      ) : (
        /* Claims Queue Table */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200 dark:divide-slate-800">
              <thead className="bg-secondary-50 dark:bg-slate-950">
                <tr>
                  <th className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all claims"
                      checked={isAllSelected}
                      onChange={(e) => {
                        if (e.target.checked) selectAllFiltered();
                        else deselectAll();
                      }}
                      className="w-4 h-4 rounded border-secondary-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Target Business
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Claimant Credentials
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Claimed At
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-secondary-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                {filteredClaims.map((claim) => {
                  const statusStyle = statusBadgeConfig[claim.status] || {
                    bg: "bg-secondary-100 dark:bg-slate-800",
                    text: "text-secondary-800 dark:text-slate-200",
                    label: claim.status,
                  };
                  const isEmailVerified = !claim.verification_token;
                  const isActionLoading = actionLoadingId === claim.id;
                  const isSelected = selectedIds.has(claim.id);

                  return (
                    <tr
                      key={claim.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-purple-50/40 dark:bg-purple-950/20"
                          : "hover:bg-secondary-50/70 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select claim for ${claim.business_name}`}
                          checked={isSelected}
                          onChange={() => toggleSelect(claim.id)}
                          className="w-4 h-4 rounded border-secondary-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-secondary-900 dark:text-white block truncate">
                            {claim.business_name}
                          </span>
                          {claim.directory_listing?.category_id && (
                            <span className="text-xs text-secondary-500 dark:text-slate-400 block capitalize">
                              {claim.directory_listing.category_id}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2 text-sm text-secondary-900 dark:text-white font-medium">
                            <span>{claim.email}</span>
                            <span className="text-xs px-1.5 py-0.5 bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 rounded">
                              {claim.role || "Owner"}
                            </span>
                          </div>
                          <span className="text-xs text-secondary-500 dark:text-slate-400 block">
                            {claim.phone || claim.contact_phone}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              isEmailVerified
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {isEmailVerified ? (
                              <>
                                <i className="ri-check-line mr-1 text-xs" />
                                Verified
                              </>
                            ) : (
                              <>
                                <i className="ri-time-line mr-1 text-xs" />
                                Token Pending
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-secondary-500 dark:text-slate-400">
                        {claim.created_at
                          ? new Date(claim.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailClaim(claim)}
                            title="View Claim Details"
                            className="p-1.5 text-secondary-500 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <i className="ri-eye-line text-lg" />
                          </button>

                          {claim.status !== "approved" && (
                            <button
                              type="button"
                              data-testid={`approve-claim-${claim.id}`}
                              onClick={() => handleApproveClaim(claim.id)}
                              disabled={isActionLoading}
                              title="Approve & Transfer Ownership"
                              className="p-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <i className="ri-shield-check-line text-lg" />
                            </button>
                          )}

                          {claim.status !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => setRejectingClaim(claim)}
                              disabled={isActionLoading}
                              title="Reject Claim"
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <i className="ri-close-circle-line text-lg" />
                            </button>
                          )}
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
        totalCount={filteredClaims.length}
        onSelectAll={selectAllFiltered}
        onDeselectAll={deselectAll}
        onBatchApprove={handleBatchApprove}
        onBatchReject={() => setIsBulkRejectModalOpen(true)}
        isLoading={isBulkLoading}
        itemLabel="claims"
        approveLabel="Approve Selected"
        rejectLabel="Reject Selected"
      />

      {/* Claim Detail Modal */}
      <ClaimDetailModal
        claim={detailClaim}
        isOpen={Boolean(detailClaim)}
        onClose={() => setDetailClaim(null)}
        onApprove={handleApproveClaim}
        onRequestReject={(c) => setRejectingClaim(c)}
      />

      {/* Single Reject Reason Modal */}
      <RejectReasonModal
        isOpen={Boolean(rejectingClaim)}
        onClose={() => setRejectingClaim(null)}
        onConfirm={handleConfirmReject}
        title="Reject Ownership Claim"
        itemName={rejectingClaim?.business_name || "this claim"}
      />

      {/* Bulk Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => setIsBulkRejectModalOpen(false)}
        onConfirm={handleConfirmBatchReject}
        title="Batch Reject Ownership Claims"
        itemName={`${selectedIds.size} selected claims`}
      />
    </div>
  );
}
