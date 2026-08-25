import React from "react";
import type { ForumReportAdminItem } from "@/api-services/admin.service";

interface ForumReportsListProps {
  reports: ForumReportAdminItem[];
  loading?: boolean;
  onPreview: (report: ForumReportAdminItem) => void;
  onResolve: (reportId: string) => Promise<void>;
  onToggleRemove: (
    targetType: "post" | "comment",
    targetId: string,
    willBeRemoved: boolean
  ) => Promise<void>;
  statusFilter: "all" | "pending" | "resolved";
  onStatusFilterChange: (status: "all" | "pending" | "resolved") => void;
  targetTypeFilter: "all" | "post" | "comment";
  onTargetTypeFilterChange: (type: "all" | "post" | "comment") => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
}

export default function ForumReportsList({
  reports,
  loading = false,
  onPreview,
  onResolve,
  onToggleRemove,
  statusFilter,
  onStatusFilterChange,
  targetTypeFilter,
  onTargetTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
}: ForumReportsListProps) {
  const filteredReports = reports.filter((r) => {
    // Status filter
    if (statusFilter === "pending" && r.resolved) return false;
    if (statusFilter === "resolved" && !r.resolved) return false;

    // Target type filter
    if (targetTypeFilter !== "all" && r.target_type !== targetTypeFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const reasonMatch = r.reason.toLowerCase().includes(q);
      const reporterMatch = (r.reporter?.full_name || "").toLowerCase().includes(q);
      const postTitleMatch = (r.target_post?.title || "").toLowerCase().includes(q);
      const postContentMatch = (r.target_post?.content || "").toLowerCase().includes(q);
      const commentBodyMatch = (r.target_comment?.body || "").toLowerCase().includes(q);
      return (
        reasonMatch ||
        reporterMatch ||
        postTitleMatch ||
        postContentMatch ||
        commentBodyMatch
      );
    }

    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-secondary-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-400 text-base" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search by reporter, reason, or content..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-secondary-50 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex rounded-xl p-1 bg-secondary-100 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-secondary-900 dark:text-white shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900"
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("pending")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900"
              }`}
            >
              Pending ({reports.filter((r) => !r.resolved).length})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("resolved")}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                statusFilter === "resolved"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900"
              }`}
            >
              Resolved ({reports.filter((r) => r.resolved).length})
            </button>
          </div>

          {/* Target Type Filter */}
          <div className="inline-flex rounded-xl p-1 bg-secondary-100 dark:bg-slate-800 border border-secondary-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onTargetTypeFilterChange("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                targetTypeFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-secondary-900 dark:text-white shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => onTargetTypeFilterChange("post")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                targetTypeFilter === "post"
                  ? "bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400"
              }`}
            >
              Posts
            </button>
            <button
              type="button"
              onClick={() => onTargetTypeFilterChange("comment")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                targetTypeFilter === "comment"
                  ? "bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-xs font-semibold"
                  : "text-secondary-600 dark:text-slate-400"
              }`}
            >
              Comments
            </button>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="p-12 text-center text-secondary-400 dark:text-slate-500">
          <i className="ri-loader-4-line animate-spin text-3xl mb-2 block" />
          <p className="text-sm">Loading violation reports queue...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center text-secondary-400 dark:text-slate-500">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary-100 dark:bg-slate-800 flex items-center justify-center text-xl text-secondary-400">
            <i className="ri-checkbox-circle-line text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-secondary-800 dark:text-slate-200">
            No Reports Found
          </h3>
          <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {reports.length === 0
              ? "All forum content is clean. There are currently no violation reports pending."
              : "No reports match your current filter and search criteria."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-secondary-700 dark:text-slate-300">
            <thead className="bg-secondary-50 dark:bg-slate-800/80 text-xs font-semibold text-secondary-500 dark:text-slate-400 uppercase tracking-wider border-b border-secondary-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Target</th>
                <th className="py-3.5 px-4">Reporter</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Content Excerpt</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-slate-800">
              {filteredReports.map((report) => {
                const isPost = report.target_type === "post";
                const excerpt = isPost
                  ? report.target_post?.title || report.target_post?.content || `Post #${report.target_id}`
                  : report.target_comment?.body || `Comment #${report.target_id}`;

                const isRemoved = isPost
                  ? report.target_post?.is_removed === true
                  : report.target_comment?.is_removed === true;

                return (
                  <tr
                    key={report.id}
                    className="hover:bg-secondary-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-secondary-500 dark:text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          isPost
                            ? "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300"
                            : "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300"
                        }`}
                      >
                        {report.target_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-secondary-900 dark:text-white text-xs">
                        {report.reporter?.full_name || "Anonymous"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                        {report.reason}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-xs text-secondary-600 dark:text-slate-300">
                      <span title={excerpt}>{excerpt}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          report.resolved
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        <i
                          className={
                            report.resolved
                              ? "ri-checkbox-circle-fill"
                              : "ri-time-fill"
                          }
                        />
                        {report.resolved ? "Resolved" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onPreview(report)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Preview
                        </button>
                        {!report.resolved && (
                          <button
                            type="button"
                            onClick={() => onResolve(report.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-accent-100 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300 hover:bg-accent-200 transition-colors cursor-pointer"
                            title="Mark resolved"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            onToggleRemove(
                              report.target_type as "post" | "comment",
                              report.target_id,
                              !isRemoved
                            )
                          }
                          className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                            isRemoved
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          }`}
                          title={isRemoved ? "Restore Content" : "Remove Content"}
                        >
                          <i className={isRemoved ? "ri-restart-line text-sm" : "ri-eye-off-line text-sm"} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
