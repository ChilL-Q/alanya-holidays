import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { blogService, type BlogComment } from "@/api-services/blog.service";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";
import { sanitizeForumHtml } from "@/utils/sanitizeHtml";

interface BlogCommentsProps {
  postId: string;
}

function CommentItem({
  comment,
  postId,
  onReply,
  replyTo,
  onCommentCreated,
  depth = 0,
}: {
  comment: BlogComment;
  postId: string;
  onReply: (parentId: string) => void;
  replyTo: string | null;
  onCommentCreated: (comment: BlogComment) => void;
  depth?: number;
}) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(comment.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(comment.like_count ?? 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;
    setIsLiking(true);
    try {
      const res = await blogService.toggleCommentLike(comment.id);
      setLiked(res.liked);
      setLikeCount((prev) => (res.liked ? prev + 1 : Math.max(0, prev - 1)));
    } catch {
      logger.warn("Failed to toggle like");
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (comment.is_removed) {
    return (
      <div className={`py-3 ${depth > 0 ? "ml-6 md:ml-10" : ""}`}>
        <p className="text-sm text-foreground-400 italic">This comment has been removed.</p>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? "ml-6 md:ml-10 border-l-2 border-background-200/70 pl-4" : ""}`}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          {comment.author?.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt={comment.author.full_name || "User"}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="ri-user-line text-primary-600 text-sm"></i>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground-900">
                {comment.author?.full_name || "Anonymous"}
              </span>
              <span className="text-xs text-foreground-400">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <div
              className="text-sm text-foreground-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeForumHtml(comment.body) }}
            />
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={handleLike}
                disabled={!isAuthenticated || isLiking}
                aria-label={liked ? "Unlike comment" : "Like comment"}
                className={`inline-flex items-center gap-1 text-xs transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  liked ? "text-red-500" : "text-foreground-400 hover:text-red-400"
                }`}
              >
                <i className={`${liked ? "ri-heart-3-fill" : "ri-heart-3-line"} text-sm`}></i>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              {isAuthenticated && depth < 3 && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="inline-flex items-center gap-1 text-xs text-foreground-400 hover:text-primary-500 transition-colors cursor-pointer"
                >
                  <i className="ri-reply-line text-sm"></i>
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
        {replyTo === comment.id && (
          <div className="ml-11 mb-4">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCancel={() => onReply(comment.id)}
              onCreated={onCommentCreated}
            />
          </div>
        )}
      </div>
      {comment.children?.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          postId={postId}
          onReply={onReply}
          replyTo={replyTo}
          onCommentCreated={onCommentCreated}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  onCancel,
  onCreated,
}: {
  postId: string;
  parentId?: string | null;
  onCancel?: () => void;
  onCreated: (comment: BlogComment) => void;
}) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      const comment = await blogService.createComment(postId, body.trim(), parentId || null);
      onCreated(comment);
      setBody("");
      onCancel?.();
    } catch {
      logger.warn("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Share your thoughts..."}
        rows={3}
        className="w-full px-4 py-3 rounded-lg border border-background-200/70 bg-background-0 text-sm text-foreground-800 placeholder:text-foreground-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100/60 outline-none resize-none transition-all"
      />
      <div className="flex items-center gap-2 mt-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!body.trim() || isSubmitting}
          className="px-4 py-1.5 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : parentId ? "Reply" : "Comment"}
        </button>
      </div>
    </form>
  );
}

export default function BlogComments({ postId }: BlogCommentsProps) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await blogService.getComments(postId);
      setComments(data);
    } catch {
      logger.warn("Failed to fetch comments");
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const buildTree = (items: BlogComment[]): BlogComment[] => {
    const map = new Map<string, BlogComment>();
    const roots: BlogComment[] = [];
    for (const item of items) {
      map.set(item.id, { ...item, children: [] });
    }
    for (const item of items) {
      const node = map.get(item.id)!;
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  };

  const handleNewComment = (comment: BlogComment) => {
    setComments((prev) => [...prev, comment]);
  };

  const tree = buildTree(comments);

  return (
    <div className="mt-12 pt-8 border-t border-background-200">
      <h3 className="font-heading text-lg text-foreground-900 mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {isAuthenticated ? (
        <CommentForm postId={postId} onCreated={handleNewComment} />
      ) : (
        <div className="bg-background-50 rounded-xl p-6 text-center border border-background-200 mb-6">
          <p className="text-sm text-foreground-500">
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-primary-500"></i>
        </div>
      ) : tree.length === 0 ? (
        <div className="bg-background-50 rounded-2xl p-8 text-center border border-background-200">
          <i className="ri-chat-3-line text-4xl text-foreground-300 mb-3 block"></i>
          <p className="text-sm text-foreground-500">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-background-200/70">
          {tree.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                onReply={(id) => setReplyTo((current) => current === id ? null : id)}
                replyTo={replyTo}
                onCommentCreated={(createdComment) => {
                  handleNewComment(createdComment);
                  setReplyTo(null);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
