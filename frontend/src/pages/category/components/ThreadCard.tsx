import { useState } from "react";
import { Link } from "react-router-dom";
import { forumService, type CategoryThread } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";

interface ThreadCardProps {
  thread: CategoryThread;
  onBookmarkToggle?: (threadId: string, bookmarked: boolean) => void;
}

export default function ThreadCard({ thread, onBookmarkToggle }: ThreadCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(thread.isBookmarked));
  const [likes, setLikes] = useState(thread.likes);
  const [isLiked, setIsLiked] = useState(Boolean(thread.isLiked));

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      await forumService.toggleBookmark(thread.id);
      onBookmarkToggle?.(thread.id, nextState);
    } catch (err) {
      logger.warn("Failed to toggle bookmark on ThreadCard:", err);
      setIsBookmarked(!nextState);
    }
  };

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikes((l) => (nextLiked ? l + 1 : Math.max(0, l - 1)));
    try {
      await forumService.toggleLike("post", thread.id);
    } catch (err) {
      logger.warn("Failed to toggle like on ThreadCard:", err);
      setIsLiked(!nextLiked);
      setLikes((l) => (!nextLiked ? l + 1 : Math.max(0, l - 1)));
    }
  };

  return (
    <article className="group bg-background-50 rounded-xl border border-background-200/70 p-4 md:p-5 hover:border-primary-200/60 transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Author avatar */}
        <Link to={`/thread/${thread.slug || thread.id}`} className="shrink-0">
          <div className="w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-full overflow-hidden bg-background-200">
            <img
              src={thread.authorAvatar}
              alt={thread.author}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row with badges */}
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                <i className="ri-pushpin-line"></i>
                Pinned
              </span>
            )}
            {thread.isHot && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full font-medium">
                <i className="ri-fire-line"></i>
                Hot
              </span>
            )}
            {thread.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-100 text-secondary-700 text-xs rounded-full font-medium">
                <i className="ri-verified-badge-line"></i>
                Verified
              </span>
            )}
            {thread.subcategory && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background-100 text-foreground-500 text-xs rounded-full">
                {thread.subcategory}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading text-base md:text-lg text-foreground-900 group-hover:text-primary-500 transition-colors leading-snug mb-1.5">
            <Link to={`/thread/${thread.slug || thread.id}`}>{thread.title}</Link>
          </h3>

          {/* Excerpt */}
          <p className="text-foreground-500 text-xs md:text-sm leading-relaxed line-clamp-2 mb-3">
            {thread.excerpt}
          </p>

          {/* Bottom meta */}
          <div className="flex items-center flex-wrap gap-3 md:gap-4 text-xs text-foreground-400">
            <span className="flex items-center gap-1">
              <i className="ri-user-line"></i>
              {thread.author}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-time-line"></i>
              {thread.postedAt}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background-100 text-foreground-500 font-medium">
              <i className="ri-chat-3-line"></i>
              {thread.replies.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-eye-line"></i>
              {thread.views.toLocaleString()} views
            </span>
          </div>
        </div>

        {/* Right side - actions (Bookmark & Like) */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleBookmarkClick}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isBookmarked
                ? "text-teal-600 bg-teal-50"
                : "text-foreground-400 hover:text-teal-600 hover:bg-background-100"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Save post"}
            aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
          >
            <i className={`${isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"} text-base`}></i>
          </button>

          <button
            type="button"
            onClick={handleLikeClick}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              isLiked
                ? "text-primary-500 bg-primary-50"
                : "text-foreground-400 hover:text-primary-500 hover:bg-background-100"
            }`}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <i className={`${isLiked ? "ri-heart-fill" : "ri-heart-line"} text-base`}></i>
          </button>
          <span className="text-xs font-medium text-foreground-500">
            {likes}
          </span>
        </div>
      </div>
    </article>
  );
}
