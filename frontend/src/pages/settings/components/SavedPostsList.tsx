import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  ThumbsUp,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Flame,
} from "lucide-react";
import { forumService, type CategoryThread } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";

export function SavedPostsList() {
  const [threads, setThreads] = useState<CategoryThread[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.getBookmarkedPosts();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      logger.error("Failed to load saved forum posts:", err);
      setError("Unable to load saved posts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSavedPosts();
  }, [fetchSavedPosts]);

  const handleRemoveBookmark = async (postId: string) => {
    const prevThreads = [...threads];
    setThreads((prev) => prev.filter((t) => t.id !== postId));
    try {
      await forumService.toggleBookmark(postId);
    } catch (err) {
      logger.warn("Failed to remove bookmark, rolling back:", err);
      setThreads(prevThreads);
    }
  };

  if (loading) {
    return (
      <div data-testid="saved-posts-loading-skeleton" className="space-y-4 animate-pulse">
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
          onClick={() => void fetchSavedPosts()}
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
        <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">No saved discussions yet</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Bookmark discussions in the community forum to save them for easy access later.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-all shadow-xs"
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
          className="p-6 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-teal-300/80 transition-all space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                {thread.category}
              </span>
              {thread.isHot && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  <Flame className="w-3 h-3 text-amber-600" />
                  Trending
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{thread.postedAt}</span>
              <button
                type="button"
                onClick={() => handleRemoveBookmark(thread.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                title="Remove from saved posts"
                aria-label="Remove from saved posts"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Saved</span>
              </button>
            </div>
          </div>

          <h4 className="font-bold text-base text-slate-900 hover:text-teal-600 transition-colors">
            <Link to={`/thread/${thread.id}`}>{thread.title}</Link>
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
              to={`/thread/${thread.id}`}
              className="font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
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
