import { Link } from "react-router-dom";
import type { ThreadDetail } from "@/mocks/thread-details";

interface OriginalPostProps {
  thread: ThreadDetail;
  onLike: () => void;
  onShare: () => void;
  onScrollToReplies: () => void;
}

export default function OriginalPost({ thread, onLike, onShare, onScrollToReplies }: OriginalPostProps) {
  return (
    <article className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden">
      {/* Author row */}
      <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 pb-0">
        <Link to={`/members`} className="shrink-0">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-background-200">
            <img
              src={thread.authorAvatar}
              alt={thread.author}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/members`}
              className="font-heading text-sm md:text-base text-foreground-900 font-semibold hover:text-primary-500 transition-colors"
            >
              {thread.author}
            </Link>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background-100 text-foreground-500 text-[10px] md:text-xs rounded-full font-medium">
              {thread.authorRole}
            </span>
          </div>
          <p className="text-xs text-foreground-400 mt-0.5">{thread.postedAt}</p>
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 md:px-5 py-4">
        <div className="text-sm md:text-base text-foreground-800 leading-relaxed whitespace-pre-line">
          {thread.content}
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-1 px-4 md:px-5 py-3 border-t border-background-200/70 bg-background-50/50">
        <button
          onClick={onLike}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            thread.isLiked
              ? "text-primary-500 bg-primary-50"
              : "text-foreground-400 hover:text-primary-500 hover:bg-background-100"
          }`}
        >
          <i className={`${thread.isLiked ? "ri-heart-fill" : "ri-heart-line"} text-sm`}></i>
          <span>{thread.likes}</span>
        </button>

        <button
          onClick={onScrollToReplies}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-400 hover:text-primary-500 hover:bg-background-100 transition-all cursor-pointer"
        >
          <i className="ri-chat-3-line text-sm"></i>
          <span>{thread.replies.length} Replies</span>
        </button>

        <button
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-all ml-auto cursor-pointer"
        >
          <i className="ri-share-line text-sm"></i>
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </article>
  );
}