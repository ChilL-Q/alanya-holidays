import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { ThreadDetail } from "@/api-services/forum.service";

interface ThreadHeroProps {
  thread: ThreadDetail;
}

export default function ThreadHero({ thread }: ThreadHeroProps) {
  const [replyBump, setReplyBump] = useState(false);
  const prevReplyCount = useRef(thread.replies.length);

  useEffect(() => {
    if (thread.replies.length > prevReplyCount.current) {
      setReplyBump(true);
      const timer = setTimeout(() => setReplyBump(false), 600);
      prevReplyCount.current = thread.replies.length;
      return () => clearTimeout(timer);
    }
    prevReplyCount.current = thread.replies.length;
  }, [thread.replies.length]);

  return (
    <div className="bg-background-50 border-b border-background-200/70">
      <div className="w-full px-4 md:px-8 lg:px-12 pt-24 md:pt-28 pb-4 md:pb-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs md:text-sm text-foreground-400 mb-3 flex-wrap">
          <Link
            to="/"
            className="hover:text-primary-500 transition-colors flex items-center gap-1"
          >
            <i className="ri-home-4-line"></i>
            Home
          </Link>
          <i className="ri-arrow-right-s-line text-foreground-300"></i>
          <Link
            to={`/category/${thread.categoryId}`}
            className="hover:text-primary-500 transition-colors"
          >
            {thread.category}
          </Link>
          <i className="ri-arrow-right-s-line text-foreground-300"></i>
          <span className="text-foreground-600 truncate max-w-[200px] md:max-w-sm">
            {thread.title}
          </span>
        </nav>

        {/* Title + Meta row */}
        <h1 className="font-heading text-xl md:text-2xl lg:text-3xl text-foreground-900 leading-tight mb-3">
          {thread.title}
        </h1>

        <div className="flex items-center flex-wrap gap-2 md:gap-3">
          {/* Badges */}
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-background-100 text-foreground-500 text-xs rounded-full">
            {thread.subcategory}
          </span>

          <span className="text-foreground-300 text-xs hidden sm:inline">·</span>

          {/* Stats */}
          <span className="flex items-center gap-1 text-xs text-foreground-400">
            <i className="ri-eye-line"></i>
            {thread.views.toLocaleString()} views
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300 ${
              replyBump
                ? "bg-primary-100 text-primary-700 scale-110"
                : "text-foreground-400"
            }`}
          >
            <i className="ri-chat-3-line"></i>
            {thread.replies.length} {thread.replies.length === 1 ? "reply" : "replies"}
          </span>
          <span className="flex items-center gap-1 text-xs text-foreground-400">
            <i className="ri-time-line"></i>
            {thread.postedAt}
          </span>
        </div>
      </div>
    </div>
  );
}