import React, { useCallback, useEffect, useState } from "react";
import { adminService, type AdminReviewItem } from "@/api-services/admin.service";
import { logger } from "@/lib/logger";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTranslation } from "react-i18next";
import "@/i18n";

type ReviewStatus = "pending" | "approved" | "rejected";

const STATUS_TABS: Array<{ id: ReviewStatus; cls: string }> = [
  { id: "pending", cls: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800" },
  { id: "approved", cls: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" },
  { id: "rejected", cls: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800" },
];

const PAGE_SIZE = 20;

const ReviewsModerationTab: React.FC<{ onCountUpdate?: (c: { total: number; pending: number }) => void }> = ({
  onCountUpdate,
}) => {
  const { t } = useTranslation();
  const [statusTab, setStatusTab] = useState<ReviewStatus>("pending");
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadReviews = useCallback(
    async (status: ReviewStatus, targetPage: number, background = false) => {
      if (!background) setLoading(true);
      setError(null);
      try {
        const res = await adminService.getModerationReviews(status, targetPage, PAGE_SIZE, {
          throwOnError: true,
        });
        setReviews(res.data);
        setTotal(res.total);
        if (onCountUpdate && status === "pending") {
          onCountUpdate({ total: res.total, pending: res.total });
        }
      } catch (err) {
        logger.error("Failed to load reviews for moderation:", err);
        setError(t("admin.reviewsLoadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [onCountUpdate, t]
  );

  useEffect(() => {
    void loadReviews(statusTab, page);
  }, [statusTab, page, loadReviews]);

  useAutoRefresh(() => loadReviews(statusTab, page, true), { intervalMs: 20000 });

  const act = async (id: string, action: () => Promise<boolean>) => {
    setActingId(id);
    setError(null);
    try {
      if (await action()) {
        await loadReviews(statusTab, page);
      } else {
        setError("Review update failed. Please try again.");
      }
    } catch (err) {
      logger.error("Failed to update review:", err);
      setError("Review update failed. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusTab(tab.id);
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
              statusTab === tab.id
                ? "bg-accent-600 text-white border-accent-600"
                : "bg-white dark:bg-slate-900 text-secondary-600 dark:text-slate-400 border-secondary-200 dark:border-slate-700 hover:border-accent-300"
            }`}
          >
            {t(`admin.reviewStatus.${tab.id}`)}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-secondary-400">{t("admin.totalCount", { count: total })}</span>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-sm text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse">
              <div className="h-4 bg-secondary-200 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 text-sm text-secondary-500 dark:text-slate-400">
          {t("admin.noReviews", { status: t(`admin.reviewStatus.${statusTab}`) })}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {reviews.map((review) => {
              const badge = STATUS_TABS.find((t) => t.id === review.status) || STATUS_TABS[0];
              const isActing = actingId === review.id;

              return (
                <div
                  key={review.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Rating stars */}
                        <span className="text-amber-500 text-sm" aria-label={`${review.rating ?? 0} of 5`}>
                          {"★".repeat(Math.round(review.rating ?? 0))}
                          <span className="text-secondary-300 dark:text-slate-600">
                            {"★".repeat(5 - Math.round(review.rating ?? 0))}
                          </span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge.cls}`}
                        >
                          {review.status}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="font-bold text-sm text-secondary-900 dark:text-white mt-1">{review.title}</h3>
                      )}
                      {review.comment && (
                        <p className="text-xs sm:text-sm text-secondary-600 dark:text-slate-300 mt-1 line-clamp-3">
                          {review.comment}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      {review.listing?.name && (
                        <p className="text-xs font-semibold text-secondary-700 dark:text-slate-300 truncate max-w-[180px]">
                          {review.listing.name}
                        </p>
                      )}
                      <p className="text-xs text-secondary-500 dark:text-slate-400">
                        {review.user?.full_name || "Anonymous"}
                      </p>
                      {review.created_at && (
                        <p className="text-[10px] text-secondary-400 dark:text-slate-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-secondary-100 dark:border-slate-800">
                    {review.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => act(review.id, () => adminService.approveReview(review.id))}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                        {t("admin.approve")}
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => act(review.id, () => adminService.rejectReview(review.id))}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors disabled:opacity-50 cursor-pointer"
                        >
                        {t("admin.reject")}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => act(review.id, () => adminService.deleteReview(review.id))}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary-100 dark:bg-slate-800 hover:bg-secondary-200 dark:hover:bg-slate-700 text-secondary-800 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t("admin.delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-secondary-700 dark:text-slate-300"
              >
                {t("admin.previous")}
              </button>
              <span className="text-xs text-secondary-500 dark:text-slate-400">
                {t("admin.pageOf", { page, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-secondary-700 dark:text-slate-300"
              >
                {t("admin.next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReviewsModerationTab;
