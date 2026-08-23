import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Eye, ThumbsUp, MessageCircle, AlertCircle, RefreshCw, ChevronRight, Flame } from "lucide-react";
import { forumService, type CategoryThread } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";

export function ForumActivityList() {
  const [threads, setThreads] = useState<CategoryThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await forumService.getThreads();
      setThreads(res && Array.isArray(res.threads) ? res.threads : []);
    } catch (err: unknown) {
      logger.error("Failed to load forum activity:", err);
      setError("Unable to load forum activity. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  if (loading) {
    return (
      <div data-testid="forum-loading-skeleton" className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="h-5 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={() => void fetchThreads()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No forum discussions yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          You haven't started any discussions or asked questions in the community forum yet.
        </p>
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-xs"
        >
          Explore Community Forum
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-emerald-300/80 transition-all space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {thread.category}
              </span>
              {thread.isHot && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <Flame className="w-3 h-3 text-amber-600" />
                  Trending
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">{thread.postedAt}</span>
          </div>

          <h4 className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors">
            <Link to="/forum">{thread.title}</Link>
          </h4>

          {thread.excerpt && (
            <p className="text-sm text-slate-600 line-clamp-2">{thread.excerpt}</p>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{thread.views}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                <span>{thread.likes}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>{thread.replies} replies</span>
              </span>
            </div>

            <Link
              to="/forum"
              className="font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Open Thread
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
