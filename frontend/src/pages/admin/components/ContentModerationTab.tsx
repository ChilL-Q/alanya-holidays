import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { adminService, type BlogSubmissionAdminItem } from "@/api-services/admin.service";
import ContentSubmissionPreviewModal from "./ContentSubmissionPreviewModal";
import BulkActionsToolbar from "./BulkActionsToolbar";
import RejectReasonModal from "./RejectReasonModal";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

interface ContentModerationTabProps {
  onContentCountUpdate?: (counts: { total: number; pending: number }) => void;
}

type SubmissionStatusFilter = "all" | "pending_review" | "approved" | "rejected";

export default function ContentModerationTab({
  onContentCountUpdate,
}: ContentModerationTabProps) {
  const [submissions, setSubmissions] = useState<BlogSubmissionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<BlogSubmissionAdminItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);

  const onContentCountUpdateRef = useRef(onContentCountUpdate);
  useEffect(() => {
    onContentCountUpdateRef.current = onContentCountUpdate;
  }, [onContentCountUpdate]);

  const fetchSubmissions = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await adminService.getContentSubmissions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        throwOnError: true,
      });
      setSubmissions(data || []);

      if (onContentCountUpdateRef.current) {
        const total = (data || []).length;
        const pending = (data || []).filter((s) => s.status === "pending_review").length;
        onContentCountUpdateRef.current({ total, pending });
      }
    } catch {
      toast.error("Failed to load creator submissions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  useAutoRefresh(() => fetchSubmissions(true), { intervalMs: 20000 });

  // Clear selection on filter or search query change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, searchQuery]);

  // Client-side filtering fallback for instant responsiveness
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.author_name && item.author_name.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [submissions, statusFilter, searchQuery]);

  // Multi-selection handlers
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
    setSelectedIds(new Set(filteredSubmissions.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllSelected =
    filteredSubmissions.length > 0 &&
    filteredSubmissions.every((s) => selectedIds.has(s.id));

  // Single Action Handlers
  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const success = await adminService.approveContentSubmission(id);
      if (success) {
        toast.success("Submission approved and published to Alanya blog!");
        setIsPreviewOpen(false);
        setSelectedSubmission(null);
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: "approved" } : s))
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Approval failed. Please try again.");
      }
    } catch {
      toast.error("Error approving submission.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setIsProcessing(true);
    try {
      const success = await adminService.rejectContentSubmission(id, reason);
      if (success) {
        toast.success("Submission rejected with feedback sent to author.");
        setIsPreviewOpen(false);
        setSelectedSubmission(null);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, status: "rejected", rejection_reason: reason } : s
          )
        );
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error("Rejection failed. Please try again.");
      }
    } catch {
      toast.error("Error rejecting submission.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Action Handlers
  const handleBatchApprove = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkLoading(true);
    try {
      // Optimistic update
      setSubmissions((prev) =>
        prev.map((s) => (selectedIds.has(s.id) ? { ...s, status: "approved" } : s))
      );

      const res = await adminService.batchApproveContentSubmissions(ids);
      if (res.successful.length > 0) {
        toast.success(`Batch approved ${res.successful.length} submission(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to approve ${res.failed.length} submission(s)`);
        await fetchSubmissions();
      }
      setSelectedIds(new Set());
    } catch {
      toast.error("Error during batch approval");
      await fetchSubmissions();
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
      setSubmissions((prev) =>
        prev.map((s) =>
          selectedIds.has(s.id)
            ? { ...s, status: "rejected", rejection_reason: reason }
            : s
        )
      );

      const res = await adminService.batchRejectContentSubmissions(ids, reason);
      if (res.successful.length > 0) {
        toast.success(`Batch rejected ${res.successful.length} submission(s)`);
      }
      if (res.failed.length > 0) {
        toast.error(`Failed to reject ${res.failed.length} submission(s)`);
        await fetchSubmissions();
      }
      setSelectedIds(new Set());
      setIsBulkRejectModalOpen(false);
    } catch {
      toast.error("Error during batch rejection");
      await fetchSubmissions();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const countsByStatus = useMemo(() => {
    return {
      all: submissions.length,
      pending_review: submissions.filter((s) => s.status === "pending_review").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };
  }, [submissions]);

  const getStatusBadgeClass = (status: string) => {
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
    <div className="space-y-6">
      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-xs transition-colors">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all" as const, label: "All Submissions", count: countsByStatus.all, highlight: false },
              {
                id: "pending_review" as const,
                label: "Pending Review",
                count: countsByStatus.pending_review,
                highlight: countsByStatus.pending_review > 0,
              },
              { id: "approved" as const, label: "Approved", count: countsByStatus.approved, highlight: false },
              { id: "rejected" as const, label: "Rejected", count: countsByStatus.rejected, highlight: false },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-accent-600 text-white shadow-xs"
                  : "bg-secondary-50 dark:bg-slate-800 text-secondary-600 dark:text-slate-300 hover:bg-secondary-100 dark:hover:bg-slate-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                  statusFilter === tab.id
                    ? "bg-white/20 text-white"
                    : tab.highlight
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                    : "bg-secondary-200 dark:bg-slate-700 text-secondary-700 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input & Select All Checkbox */}
        <div className="flex items-center space-x-3">
          {filteredSubmissions.length > 0 && (
            <button
              type="button"
              onClick={isAllSelected ? deselectAll : selectAllFiltered}
              className="text-xs font-semibold text-secondary-600 dark:text-slate-300 hover:text-accent-600 dark:hover:text-accent-400 whitespace-nowrap cursor-pointer"
            >
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
          )}

          <div className="relative min-w-[240px] sm:min-w-[300px]">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 dark:text-slate-500 text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search submissions by title, creator, content..."
              className="w-full pl-10 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50/50 dark:bg-slate-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 dark:text-slate-500 dark:hover:text-slate-300 text-base p-1 cursor-pointer"
              >
                <i className="ri-close-circle-fill" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800">
          <i className="ri-loader-4-line text-3xl text-accent-600 animate-spin mb-2 inline-block" />
          <p className="text-sm text-secondary-500 dark:text-slate-400">Loading creator submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3 text-2xl">
            <i className="ri-inbox-archive-line" />
          </div>
          <h3 className="text-base font-bold text-secondary-900 dark:text-white">
            No Creator Submissions Found
          </h3>
          <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No submissions matched "${searchQuery}". Try a different keyword or filter.`
              : `No submissions currently in "${statusFilter}" state.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub) => {
            const isSelected = selectedIds.has(sub.id);
            return (
              <div
                key={sub.id}
                className={`group rounded-2xl bg-white dark:bg-slate-900 border ${
                  isSelected
                    ? "border-accent-500 dark:border-accent-500 ring-2 ring-accent-500/20 bg-accent-50/20 dark:bg-accent-950/10"
                    : "border-secondary-200 dark:border-slate-800 hover:border-secondary-300 dark:hover:border-slate-700"
                } shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  {/* Header Pills & Checkbox */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${sub.title}`}
                        checked={isSelected}
                        onChange={() => toggleSelect(sub.id)}
                        className="w-4 h-4 rounded border-secondary-300 dark:border-slate-600 text-accent-600 focus:ring-accent-500 cursor-pointer"
                      />
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border uppercase tracking-wider ${getStatusBadgeClass(
                          sub.status
                        )}`}
                      >
                        {sub.status.replace("_", " ")}
                      </span>
                    </div>

                    {sub.category && (
                      <span className="text-xs font-semibold text-secondary-500 dark:text-slate-400 bg-secondary-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {sub.category}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-secondary-900 dark:text-white line-clamp-2 leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                    {sub.title}
                  </h4>

                  {/* Content Excerpt */}
                  <p className="text-xs text-secondary-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {sub.content}
                  </p>

                  {/* Creator Meta */}
                  <div className="pt-2 border-t border-secondary-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-secondary-700 dark:text-slate-300">
                      <span className="font-medium truncate">
                        <i className="ri-user-line mr-1 text-secondary-400 dark:text-slate-500" />
                        {sub.author_name || sub.user?.full_name || "Creator"}
                      </span>
                      {sub.payment_details && (
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400">
                          {sub.payment_details.method}
                        </span>
                      )}
                    </div>
                    {sub.author_email && (
                      <p className="text-[11px] text-secondary-500 dark:text-slate-400 truncate">
                        {sub.author_email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-2 border-t border-secondary-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-secondary-400 dark:text-slate-500">
                    {new Date(sub.created_at).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    aria-label={`Review ${sub.title}`}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setIsPreviewOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-accent-50 dark:bg-accent-950/50 text-accent-700 dark:text-accent-300 hover:bg-accent-100 dark:hover:bg-accent-900/50 transition-colors cursor-pointer"
                  >
                    <span>Review</span>
                    <i className="ri-arrow-right-line" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredSubmissions.length}
        onSelectAll={selectAllFiltered}
        onDeselectAll={deselectAll}
        onBatchApprove={handleBatchApprove}
        onBatchReject={() => setIsBulkRejectModalOpen(true)}
        isLoading={isBulkLoading}
        itemLabel="submissions"
        approveLabel="Approve Selected"
        rejectLabel="Reject Selected"
      />

      {/* Preview & Action Modal */}
      <ContentSubmissionPreviewModal
        isOpen={isPreviewOpen}
        submission={selectedSubmission}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedSubmission(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />

      {/* Bulk Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => setIsBulkRejectModalOpen(false)}
        onConfirm={handleConfirmBatchReject}
        title="Batch Reject Creator Submissions"
        itemName={`${selectedIds.size} selected submissions`}
      />
    </div>
  );
}
