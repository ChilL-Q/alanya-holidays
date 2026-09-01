import React, { useState, useEffect, useCallback } from "react";
import ForumStatsCard from "./ForumStatsCard";
import ForumReportsList from "./ForumReportsList";
import ForumPostPreviewModal from "./ForumPostPreviewModal";
import {
  adminService,
  type ForumReportAdminItem,
  type ForumRemovedCommentItem,
  type ForumStatsAdminItem,
} from "@/api-services/admin.service";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface ForumModerationTabProps {
  onReportCountUpdate?: (counts: { total: number; pending: number }) => void;
}

export default function ForumModerationTab({
  onReportCountUpdate,
}: ForumModerationTabProps) {
  const { t } = useTranslation();
  const [subView, setSubView] = useState<"reports" | "removed_comments">("reports");
  const [stats, setStats] = useState<ForumStatsAdminItem | null>(null);
  const [reports, setReports] = useState<ForumReportAdminItem[]>([]);
  const [removedComments, setRemovedComments] = useState<ForumRemovedCommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ForumReportAdminItem | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<"all" | "post" | "comment">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const [fetchedStats, fetchedReports, fetchedRemoved] = await Promise.all([
        adminService.getForumStats({ throwOnError: true }),
        adminService.getForumReports({ includeResolved: true, throwOnError: true }),
        adminService.getRemovedForumComments(50, { throwOnError: true }),
      ]);

      setStats(fetchedStats);
      setReports(fetchedReports);
      setRemovedComments(fetchedRemoved);

      const pendingCount = (fetchedReports || []).filter((r) => !r.resolved).length;
      if (onReportCountUpdate) {
        onReportCountUpdate({
          total: (fetchedReports || []).length,
          pending: pendingCount,
        });
      }
    } catch {
      setError(t("adminQueue.forumError"));
    } finally {
      setLoading(false);
    }
  }, [onReportCountUpdate, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useAutoRefresh(() => fetchData(true), { intervalMs: 15000 });

  // Actions
  const handleResolveReport = async (reportId: string) => {
    setError(null);
    const success = await adminService.resolveForumReport(reportId);
    if (success) {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, resolved: true } : r))
      );
      if (selectedReport?.id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, resolved: true } : null));
      }
      return true;
    }
    setError(t("adminQueue.forumError"));
    return false;
  };

  const handleToggleRemove = async (
    targetType: "post" | "comment",
    targetId: string,
    willBeRemoved: boolean
  ) => {
    setError(null);
    if (targetType === "post") {
      const success = await adminService.setForumPostRemoved(targetId, willBeRemoved);
      if (success) {
        setReports((prev) =>
          prev.map((r) => {
            if (r.target_type === "post" && r.target_id === targetId && r.target_post) {
              return {
                ...r,
                target_post: { ...r.target_post, is_removed: willBeRemoved },
              };
            }
            return r;
          })
        );
        if (selectedReport?.target_id === targetId && selectedReport.target_post) {
          const currentPost = selectedReport.target_post;
          setSelectedReport((prev) =>
            prev && prev.target_post
              ? {
                  ...prev,
                  target_post: {
                    ...currentPost,
                    is_removed: willBeRemoved,
                  },
                }
              : null
          );
        }
        return true;
      }
    } else {
      const success = await adminService.setForumCommentRemoved(targetId, willBeRemoved);
      if (success) {
        setReports((prev) =>
          prev.map((r) => {
            if (r.target_type === "comment" && r.target_id === targetId && r.target_comment) {
              return {
                ...r,
                target_comment: { ...r.target_comment, is_removed: willBeRemoved },
              };
            }
            return r;
          })
        );
        if (selectedReport?.target_id === targetId && selectedReport.target_comment) {
          const currentComment = selectedReport.target_comment;
          setSelectedReport((prev) =>
            prev && prev.target_comment
              ? {
                  ...prev,
                  target_comment: {
                    ...currentComment,
                    is_removed: willBeRemoved,
                  },
                }
              : null
          );
        }
        setRemovedComments((prev) =>
          willBeRemoved
            ? prev
            : prev.filter((c) => c.id !== targetId)
        );
        return true;
      }
    }
    setError(t("adminQueue.forumError"));
    return false;
  };

  const handleTogglePin = async (postId: string, willBePinned: boolean) => {
    setError(null);
    const success = await adminService.setForumPostPinned(postId, willBePinned);
    if (success) {
      setReports((prev) =>
        prev.map((r) => {
          if (r.target_type === "post" && r.target_id === postId && r.target_post) {
            return {
              ...r,
              target_post: { ...r.target_post, is_pinned: willBePinned },
            };
          }
          return r;
        })
      );
      if (selectedReport?.target_id === postId && selectedReport.target_post) {
        const currentPost = selectedReport.target_post;
        setSelectedReport((prev) =>
          prev && prev.target_post
            ? {
                ...prev,
                target_post: { ...currentPost, is_pinned: willBePinned },
              }
          : null
        );
      }
      return true;
    }
    setError(t("adminQueue.forumError"));
    return false;
  };

  const handleDelete = async (targetType: "post" | "comment", targetId: string) => {
    setError(null);
    if (targetType === "post") {
      const success = await adminService.deleteForumPost(targetId);
      if (success) {
        setReports((prev) =>
          prev.map((report) =>
            report.target_type === "post" && report.target_id === targetId
              ? { ...report, target_missing: true, target_post: null }
              : report
          )
        );
        return true;
      }
    } else {
      const success = await adminService.deleteForumComment(targetId);
      if (success) {
        setReports((prev) =>
          prev.map((report) =>
            report.target_type === "comment" && report.target_id === targetId
              ? { ...report, target_missing: true, target_comment: null }
              : report
          )
        );
        setRemovedComments((prev) => prev.filter((c) => c.id !== targetId));
        return true;
      }
    }
    setError(t("adminQueue.forumError"));
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Vital Stats Card */}
      <ForumStatsCard stats={stats} loading={loading} onRefresh={fetchData} />

      {/* Sub-view Navigation */}
      <div className="flex items-center justify-between border-b border-secondary-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setSubView("reports")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              subView === "reports"
                ? "bg-accent-600 text-white shadow-xs"
                : "bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700"
            }`}
          >
            <i className="ri-alarm-warning-line text-base" />
            <span>{t("adminQueue.violationQueue")}</span>
            {reports.filter((r) => !r.resolved).length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                {reports.filter((r) => !r.resolved).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSubView("removed_comments")}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
              subView === "removed_comments"
                ? "bg-accent-600 text-white shadow-xs"
                : "bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 hover:bg-secondary-200 dark:hover:bg-slate-700"
            }`}
          >
            <i className="ri-chat-delete-line text-base" />
            <span>{t("adminQueue.removedComments")}</span>
            {removedComments.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-secondary-200 dark:bg-slate-700 text-secondary-800 dark:text-slate-200">
                {removedComments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {error}
        </div>
      )}

      {/* View Content */}
      {subView === "reports" ? (
        <ForumReportsList
          reports={reports}
          loading={loading}
          onPreview={(r) => setSelectedReport(r)}
          onResolve={handleResolveReport}
          onToggleRemove={handleToggleRemove}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          targetTypeFilter={targetTypeFilter}
          onTargetTypeFilterChange={setTargetTypeFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-secondary-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-secondary-900 dark:text-white">
              {t("adminQueue.softDeletedQueue")}
            </h3>
            <p className="text-xs text-secondary-500 dark:text-slate-400">
              {t("adminQueue.hiddenCommentAudit")}
            </p>
          </div>

          {removedComments.length === 0 ? (
            <div className="p-12 text-center text-secondary-400 dark:text-slate-500">
              <i className="ri-chat-check-line text-3xl mb-2 block text-emerald-500" />
              <p className="text-sm font-semibold text-secondary-800 dark:text-slate-200">
                {t("adminQueue.noRemovedComments")}
              </p>
              <p className="text-xs text-secondary-500 dark:text-slate-400 mt-1">
                {t("adminQueue.noSoftDeleted")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-secondary-700 dark:text-slate-300">
                <thead className="bg-secondary-50 dark:bg-slate-800/80 text-xs font-semibold text-secondary-500 dark:text-slate-400 uppercase tracking-wider border-b border-secondary-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">{t("adminQueue.date")}</th>
                    <th className="py-3.5 px-4">{t("adminQueue.author")}</th>
                    <th className="py-3.5 px-4">{t("adminQueue.commentText")}</th>
                    <th className="py-3.5 px-4 text-right">{t("adminQueue.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-slate-800">
                  {removedComments.map((comment) => (
                    <tr
                      key={comment.id}
                      className="hover:bg-secondary-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-secondary-500 dark:text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-secondary-900 dark:text-white text-xs">
                        {comment.author_name || comment.user_id || t("adminQueue.anonymousAuthor")}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-secondary-700 dark:text-slate-300 max-w-md truncate">
                        <span title={comment.body}>{comment.body}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleRemove("comment", comment.id, false)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            {t("adminQueue.restore")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("comment", comment.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            {t("adminQueue.hardDelete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <ForumPostPreviewModal
        report={selectedReport}
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        onResolve={handleResolveReport}
        onToggleRemove={handleToggleRemove}
        onTogglePin={handleTogglePin}
        onDelete={handleDelete}
      />
    </div>
  );
}
