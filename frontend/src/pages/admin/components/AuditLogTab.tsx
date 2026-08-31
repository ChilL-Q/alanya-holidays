import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  adminService,
  type ModerationAuditLogItem,
  type AuditLogQueryParams,
} from "@/api-services/admin.service";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface AuditLogTabProps {
  onCountUpdate?: (counts: { total: number }) => void;
}

const ENTITY_TYPES = [
  { value: "all", label: "adminQueue.allEntityTypes" },
  { value: "listing", label: "adminQueue.directoryListing" },
  { value: "claim", label: "adminQueue.listingClaim" },
  { value: "forum_post", label: "adminQueue.forumPost" },
  { value: "forum_comment", label: "adminQueue.forumComment" },
  { value: "forum_report", label: "adminQueue.forumReport" },
  { value: "blog_submission", label: "adminQueue.blogSubmission" },
  { value: "blog_post", label: "adminQueue.blogPost" },
];

const ACTION_TYPES = [
  { value: "all", label: "adminQueue.allActions" },
  { value: "approve", label: "adminQueue.approve" },
  { value: "reject", label: "adminQueue.reject" },
  { value: "feature", label: "adminQueue.feature" },
  { value: "unfeature", label: "adminQueue.unfeature" },
  { value: "verify", label: "adminQueue.verify" },
  { value: "unverify", label: "adminQueue.unverify" },
  { value: "update_score", label: "adminQueue.updateScore" },
  { value: "pin", label: "adminQueue.pin" },
  { value: "unpin", label: "adminQueue.unpin" },
  { value: "remove", label: "adminQueue.remove" },
  { value: "restore", label: "adminQueue.restore" },
  { value: "resolve", label: "adminQueue.resolve" },
  { value: "delete", label: "adminQueue.delete" },
];

export default function AuditLogTab({ onCountUpdate }: AuditLogTabProps) {
  const { t } = useTranslation();
  const onCountUpdateRef = React.useRef(onCountUpdate);
  useEffect(() => {
    onCountUpdateRef.current = onCountUpdate;
  }, [onCountUpdate]);

  const [logs, setLogs] = useState<ModerationAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [entityType, setEntityType] = useState("all");
  const [actionType, setActionType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selected item for inspection modal
  const [inspectItem, setInspectItem] = useState<ModerationAuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const params: AuditLogQueryParams = {
        page: currentPage,
        limit: pageSize,
      };
      if (entityType !== "all") params.entity_type = entityType;
      if (actionType !== "all") params.action = actionType;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await adminService.getAuditLogs({ ...params, throwOnError: true });
      setLogs(result.data || []);
      setTotalCount(result.total || 0);
      setTotalPages(result.totalPages || 1);

      if (onCountUpdateRef.current) {
        onCountUpdateRef.current({ total: result.total || 0 });
      }
    } catch {
      setError(t("adminQueue.auditLoadError"));
    } finally {
      setLoading(false);
    }

  }, [currentPage, pageSize, entityType, actionType, searchQuery, startDate, endDate, t]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  useAutoRefresh(() => fetchLogs(true), { intervalMs: 30000 });


  const handleClearFilters = () => {
    setEntityType("all");
    setActionType("all");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      entityType !== "all" ||
      actionType !== "all" ||
      searchQuery.trim() !== "" ||
      startDate !== "" ||
      endDate !== ""
    );
  }, [entityType, actionType, searchQuery, startDate, endDate]);

  const handleCopyJson = (data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toLowerCase()) {
      case "approve":
      case "verify":
      case "resolve":
      case "restore":
        return "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "reject":
      case "remove":
      case "delete":
        return "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      case "feature":
      case "unfeature":
      case "update_score":
        return "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      case "pin":
      case "unpin":
        return "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      default:
        return "bg-secondary-100 dark:bg-slate-800 text-secondary-800 dark:text-slate-300 border-secondary-200 dark:border-slate-700";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "approve":
        return "ri-checkbox-circle-line";
      case "reject":
        return "ri-close-circle-line";
      case "feature":
        return "ri-star-fill";
      case "unfeature":
        return "ri-star-line";
      case "verify":
        return "ri-verified-badge-fill";
      case "unverify":
        return "ri-shield-line";
      case "update_score":
        return "ri-award-line";
      case "pin":
        return "ri-pushpin-fill";
      case "unpin":
        return "ri-pushpin-line";
      case "remove":
        return "ri-eye-off-line";
      case "restore":
        return "ri-restart-line";
      case "resolve":
        return "ri-check-double-line";
      case "delete":
        return "ri-delete-bin-line";
      default:
        return "ri-file-list-line";
    }
  };

  const getActionLabel = (action: string) => {
    const key = action === "update_score" ? "updateScore" : action;
    const translated = t(`adminQueue.${key}`);
    return translated === `adminQueue.${key}` ? action.replace(/_/g, " ") : translated;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6" data-testid="audit-log-tab">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-secondary-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <i className="ri-history-line text-accent-600 dark:text-accent-400" />
            {t("adminQueue.auditTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400 mt-1">
            {t("adminQueue.auditDescription")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void fetchLogs();
            }}
            disabled={loading}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 text-secondary-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={t("adminQueue.refreshAudit")}
          >
            <i className={`ri-refresh-line ${loading ? "animate-spin" : ""}`} />
            <span>{t("adminQueue.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-secondary-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Search by Entity ID or Reason */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-secondary-700 dark:text-slate-300 mb-1.5">
              {t("adminQueue.search")}
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 text-sm" />
              <input
                type="text"
                placeholder={t("adminQueue.entityReasonPlaceholder")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Entity Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 dark:text-slate-300 mb-1.5">
              {t("adminQueue.entityType")}
            </label>
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("adminQueue.filterEntity")}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-accent-500"
            >
              {ENTITY_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 dark:text-slate-300 mb-1.5">
              {t("adminQueue.action")}
            </label>
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("adminQueue.filterAction")}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-accent-500"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a.value} value={a.value}>
                  {t(a.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 dark:text-slate-300 mb-1.5">
              {t("adminQueue.fromDate")}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-secondary-700 dark:text-slate-300 mb-1.5">
              {t("adminQueue.toDate")}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-800 text-secondary-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>

        {/* Active Filters Clear Button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-secondary-100 dark:border-slate-800 text-xs">
            <span className="text-secondary-500 dark:text-slate-400">
              {t("adminQueue.filtersApplied", { count: totalCount })}
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-accent-600 dark:text-accent-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-close-circle-line" />
              <span>{t("adminQueue.clearFilters")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-rose-800 dark:text-rose-300 text-sm"
        >
          <div className="flex items-center gap-2">
            <i className="ri-error-warning-line text-lg" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchLogs();
            }}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            {t("adminQueue.retry")}
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-secondary-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-secondary-50/80 dark:bg-slate-800/60 border-b border-secondary-200 dark:border-slate-800 text-secondary-600 dark:text-slate-400 font-semibold">
                <th className="py-3.5 px-4">{t("adminQueue.dateTime")}</th>
                <th className="py-3.5 px-4">{t("adminQueue.adminActor")}</th>
                <th className="py-3.5 px-4">{t("adminQueue.action")}</th>
                <th className="py-3.5 px-4">{t("adminQueue.targetEntity")}</th>
                <th className="py-3.5 px-4">{t("adminQueue.reasonNotes")}</th>
                <th className="py-3.5 px-4 text-right">{t("adminQueue.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-slate-800">
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded-sm w-28" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded-sm w-32" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 bg-secondary-200 dark:bg-slate-800 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded-sm w-36" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded-sm w-44" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-6 bg-secondary-200 dark:bg-slate-800 rounded-md w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <i className="ri-file-search-line text-4xl text-secondary-300 dark:text-slate-600" />
                      <p className="font-semibold text-base text-secondary-700 dark:text-slate-300">
                        {t("adminQueue.noAuditLogs")}
                      </p>
                      <p className="text-xs text-secondary-400 dark:text-slate-500 max-w-sm">
                        {hasActiveFilters
                          ? t("adminQueue.noAuditMatch")
                          : t("adminQueue.noAuditYet")}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800 hover:bg-accent-100"
                        >
                          {t("adminQueue.resetFilters")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-secondary-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-secondary-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <i className="ri-time-line text-secondary-400 text-xs" />
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Admin Actor */}
                    <td className="py-3.5 px-4 text-secondary-800 dark:text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent-100 dark:bg-accent-950/80 text-accent-700 dark:text-accent-300 flex items-center justify-center text-xs font-bold">
                          {item.admin?.full_name ? item.admin.full_name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs leading-tight">
                            {item.admin?.full_name || t("adminQueue.admin")}
                          </span>
                          {item.admin?.email && (
                            <span className="text-[10px] text-secondary-400 dark:text-slate-500">
                              {item.admin.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getActionBadgeClass(
                          item.action
                        )}`}
                      >
                        <i className={getActionIcon(item.action)} />
                        <span>{getActionLabel(item.action)}</span>
                      </span>
                    </td>

                    {/* Target Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 font-semibold text-[11px] uppercase tracking-wide border border-secondary-200 dark:border-slate-700">
                          {t(`adminQueue.${item.entity_type === "listing" ? "directoryListing" : item.entity_type === "claim" ? "listingClaim" : item.entity_type === "forum_post" ? "forumPost" : item.entity_type === "forum_comment" ? "forumComment" : item.entity_type === "forum_report" ? "forumReport" : item.entity_type === "blog_submission" ? "blogSubmission" : item.entity_type === "blog_post" ? "blogPost" : "entityType"}`)}
                        </span>
                        <code
                          className="font-mono text-xs text-secondary-600 dark:text-slate-400 truncate max-w-[120px] sm:max-w-[160px]"
                          title={item.entity_id}
                        >
                          {item.entity_id}
                        </code>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 text-secondary-600 dark:text-slate-300 max-w-[200px] truncate">
                      {item.reason ? (
                        <span title={item.reason}>{item.reason}</span>
                      ) : (
                        <span className="text-secondary-400 dark:text-slate-500 italic">—</span>
                      )}
                    </td>

                    {/* Metadata Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectItem(item)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary-100 dark:bg-slate-800 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-950/50 dark:hover:text-accent-300 border border-secondary-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title={t("adminQueue.viewPayload")}
                        data-testid={`inspect-audit-${item.id}`}
                      >
                        <i className="ri-code-s-slash-line" />
                        <span>{t("adminQueue.inspect")}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 bg-secondary-50/60 dark:bg-slate-800/40 border-t border-secondary-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-600 dark:text-slate-400">
            <div>
              {t("adminQueue.showing")} <span className="font-semibold text-secondary-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> {t("adminQueue.to")} {" "}
              <span className="font-semibold text-secondary-900 dark:text-white">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{" "}
              {t("adminQueue.of")} <span className="font-semibold text-secondary-900 dark:text-white">{totalCount}</span> {t("adminQueue.entries")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t("adminQueue.previous")}
              </button>
              <span className="px-2 font-bold text-secondary-900 dark:text-white">
                {t("adminQueue.page")} {currentPage} {t("adminQueue.of")} {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-secondary-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t("adminQueue.next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {inspectItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-inspect-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-secondary-200 dark:border-slate-800 flex items-center justify-between bg-secondary-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-accent-100 dark:bg-accent-950/80 text-accent-700 dark:text-accent-300 flex items-center justify-center text-base">
                  <i className="ri-file-text-line" />
                </div>
                <div>
                  <h3 id="audit-inspect-title" className="text-base font-bold text-secondary-900 dark:text-white">
                    {t("adminQueue.eventPayload")}
                  </h3>
                  <p className="text-xs text-secondary-500 dark:text-slate-400">
                    {t("adminQueue.eventId")}: <span className="font-mono">{inspectItem.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                aria-label={t("adminQueue.close")}
                className="w-8 h-8 rounded-xl text-secondary-500 hover:bg-secondary-100 dark:hover:bg-slate-800 flex items-center justify-center text-lg transition-colors cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-secondary-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-secondary-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[11px] font-semibold text-secondary-500 dark:text-slate-400 block">
                    {t("adminQueue.action")}
                  </span>
                  <span className="font-bold text-secondary-900 dark:text-white capitalize">
                    {inspectItem.action}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-secondary-500 dark:text-slate-400 block">
                    {t("adminQueue.entityType")}
                  </span>
                  <span className="font-bold text-secondary-900 dark:text-white">
                    {inspectItem.entity_type}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-secondary-500 dark:text-slate-400 block">
                    {t("adminQueue.entityId")}
                  </span>
                  <span className="font-mono text-xs text-secondary-900 dark:text-white break-all">
                    {inspectItem.entity_id}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-secondary-500 dark:text-slate-400 block">
                    {t("adminQueue.timestamp")}
                  </span>
                  <span className="text-secondary-900 dark:text-white">
                    {formatDateTime(inspectItem.created_at)}
                  </span>
                </div>
                {inspectItem.reason && (
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold text-secondary-500 dark:text-slate-400 block">
                      {t("adminQueue.reasonNotes")}
                    </span>
                    <span className="text-secondary-900 dark:text-white">
                      {inspectItem.reason}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-secondary-800 dark:text-slate-200">
                    {t("adminQueue.metadata")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyJson(inspectItem.metadata || {})}
                    className="text-xs text-accent-600 dark:text-accent-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <i className={copied ? "ri-check-line" : "ri-file-copy-line"} />
                    <span>{copied ? t("adminQueue.copied") : t("adminQueue.copyJson")}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {JSON.stringify(inspectItem.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-secondary-200 dark:border-slate-800 bg-secondary-50/50 dark:bg-slate-800/40 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-secondary-200 dark:bg-slate-700 hover:bg-secondary-300 dark:hover:bg-slate-600 text-secondary-800 dark:text-white rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {t("adminQueue.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
