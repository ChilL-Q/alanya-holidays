import { useState, useEffect } from "react";
import { forumService, type ThreadReply } from "@/api-services/forum.service";
import { sanitizeForumHtml } from "@/utils/sanitizeHtml";
import { useAuth } from "@/context/AuthContext";
import RichTextEditor from "@/components/base/RichTextEditor";
import { logger } from "@/lib/logger";
import ReportModal from "./ReportModal";

interface ReplyCardProps {
  reply: ThreadReply;
  depth?: number;
  onLike: (replyId: string) => void;
  onReply: (replyId: string) => void;
  onUpdate?: (replyId: string, newContent: string) => Promise<void> | void;
}

export default function ReplyCard({ reply, depth = 0, onLike, onReply, onUpdate }: ReplyCardProps) {
  const { user, profile } = useAuth();
  const [showReplies, setShowReplies] = useState(depth < 2);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(reply.content);
  const [editContent, setEditContent] = useState(reply.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const maxDepth = 4;

  useEffect(() => {
    setContent(reply.content);
    setEditContent(reply.content);
  }, [reply.content]);

  const isAuthor = Boolean(
    (user?.id && reply.authorId && user.id === reply.authorId) ||
    (reply.author && (profile?.full_name === reply.author || (user?.user_metadata?.full_name as string) === reply.author))
  );
  const isAdmin = profile?.role === "admin";
  const canEdit = isAuthor || isAdmin;

  const handleSave = async () => {
    if (!editContent.trim() || editContent === "<p></p>") return;
    const prevContent = content;
    setContent(editContent);
    setIsSaving(true);
    try {
      if (onUpdate) {
        await onUpdate(reply.id, editContent);
      } else {
        await forumService.updateComment(reply.id, editContent);
      }
      setIsEditing(false);
    } catch (err) {
      logger.error("Failed to update comment:", err);
      setContent(prevContent);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleReportSubmit = async (reason: string) => {
    const success = await forumService.reportContent("comment", reply.id, reason);
    if (success) {
      alert("Report submitted successfully.");
      setIsReportModalOpen(false);
    } else {
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-5 md:ml-8 border-l-2 border-background-200/70 pl-3 md:pl-5" : ""}`}>
      <div className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden mb-2">
        {/* Reply header */}
        <div className="flex items-start justify-between gap-3 p-3 md:p-4 pb-0">
          <div className="flex items-start gap-3 min-w-0">
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

          {/* Edit button */}
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditContent(content);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-foreground-500 hover:text-primary-600 hover:bg-background-100 transition-colors"
              aria-label="Edit reply"
            >
              <i className="ri-edit-line text-xs"></i>
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Reply content or Edit Mode */}
        <div className="px-3 md:px-4 py-3">
          {isEditing ? (
            <div className="space-y-2">
              <RichTextEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit your reply..."
                userId={user?.id}
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1 rounded-lg border border-background-200 text-xs font-medium text-foreground-600 hover:bg-background-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                >
                  {isSaving && <i className="ri-loader-4-line animate-spin text-xs"></i>}
                  <span>{isSaving ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-xs md:text-sm text-foreground-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeForumHtml(content) }}
            />
          )}
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

          {/* Report button */}
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-medium text-foreground-400 hover:text-rose-500 hover:bg-background-100 transition-all cursor-pointer"
            aria-label="Report reply"
          >
            <i className="ri-flag-line text-xs"></i>
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Nested replies */}
      {(reply.replies?.length ?? 0) > 0 && depth < maxDepth && (
        <div className="mb-2">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 font-medium py-1.5 px-3 transition-colors"
            >
              <i className="ri-arrow-down-s-line"></i>
              Show {reply.replies?.length} {reply.replies?.length === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {reply.replies?.map((nested) => (
                <ReplyCard
                  key={nested.id}
                  reply={nested}
                  depth={depth + 1}
                  onLike={onLike}
                  onReply={onReply}
                  onUpdate={onUpdate}
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

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
