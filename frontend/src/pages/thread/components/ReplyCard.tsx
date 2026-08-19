import { useState } from "react";
import type { ThreadReply } from "@/mocks/thread-details";

interface ReplyCardProps {
  reply: ThreadReply;
  depth?: number;
  onLike: (replyId: string) => void;
  onReply: (replyId: string) => void;
}

export default function ReplyCard({ reply, depth = 0, onLike, onReply }: ReplyCardProps) {
  const [showReplies, setShowReplies] = useState(depth < 2);
  const maxDepth = 4;

  return (
    <div className={`${depth > 0 ? "ml-5 md:ml-8 border-l-2 border-background-200/70 pl-3 md:pl-5" : ""}`}>
      <div className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden mb-2">
        {/* Reply header */}
        <div className="flex items-start gap-3 p-3 md:p-4 pb-0">
          <div className="w-8 h-8 md:w-9 md:h-9 shrink-0 rounded-full overflow-hidden bg-background-200">
            <img
              src={reply.authorAvatar}
              alt={reply.author}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading text-xs md:text-sm text-foreground-900 font-semibold">
                {reply.author}
              </span>
              {reply.isOriginalPoster && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-full font-medium whitespace-nowrap">
                  OP
                </span>
              )}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background-100 text-foreground-500 text-[10px] rounded-full font-medium whitespace-nowrap">
                {reply.authorRole}
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-foreground-400 mt-0.5">{reply.postedAt}</p>
          </div>
        </div>

        {/* Reply content */}
        <div className="px-3 md:px-4 py-3">
          <p className="text-xs md:text-sm text-foreground-700 leading-relaxed whitespace-pre-line">
            {reply.content}
          </p>
        </div>

        {/* Reply actions */}
        <div className="flex items-center gap-1 px-3 md:px-4 py-2 border-t border-background-200/70 bg-background-50/50">
          <button
            onClick={() => onLike(reply.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-medium transition-all ${
              reply.isLiked
                ? "text-primary-500 bg-primary-50"
                : "text-foreground-400 hover:text-primary-500 hover:bg-background-100"
            }`}
          >
            <i className={`${reply.isLiked ? "ri-heart-fill" : "ri-heart-line"} text-xs`}></i>
            {reply.likes > 0 && <span>{reply.likes}</span>}
          </button>

          {depth < maxDepth && (
            <button
              onClick={() => onReply(reply.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-medium text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-all"
            >
              <i className="ri-reply-line text-xs"></i>
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {reply.replies.length > 0 && depth < maxDepth && (
        <div className="mb-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium py-1.5 px-3 transition-colors"
            >
              <i className="ri-arrow-down-s-line"></i>
              Show {reply.replies.length} {reply.replies.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {reply.replies.map((nested) => (
                <ReplyCard
                  key={nested.id}
                  reply={nested}
                  depth={depth + 1}
                  onLike={onLike}
                  onReply={onReply}
                />
              ))}
              {depth > 0 && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="flex items-center gap-1.5 text-xs text-foreground-400 hover:text-foreground-600 font-medium py-1.5 px-3 transition-colors"
                >
                  <i className="ri-arrow-up-s-line"></i>
                  Hide replies
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}