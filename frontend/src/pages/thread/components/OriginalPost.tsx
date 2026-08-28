import { useState, useEffect } from "react";
import { forumService, type ThreadDetail } from "@/api-services/forum.service";
import { deleteForumImage, uploadForumImage } from "@/api-services/storage.service";
import { sanitizeForumHtml } from "@/utils/sanitizeHtml";
import { useAuth } from "@/context/AuthContext";
import RichTextEditor from "@/components/base/RichTextEditor";
import { logger } from "@/lib/logger";
import ReportModal from "./ReportModal";

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PostUpdates = { body: string; image_url: string | null };

interface OriginalPostProps {
  thread: ThreadDetail;
  onLike: () => void;
  onShare: () => void;
  onScrollToReplies: () => void;
  onBookmark?: () => void;
  onUpdate?: (updates: PostUpdates) => Promise<void> | void;
}

export default function OriginalPost({
  thread,
  onLike,
  onShare,
  onScrollToReplies,
  onBookmark,
  onUpdate,
}: OriginalPostProps) {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(thread.content);
  const [editContent, setEditContent] = useState(thread.content);
  const [imageUrl, setImageUrl] = useState(thread.imageUrl);
  const [editImageUrl, setEditImageUrl] = useState(thread.imageUrl);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(thread.isBookmarked));
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    setContent(thread.content);
    setEditContent(thread.content);
  }, [thread.content]);

  useEffect(() => {
    setIsBookmarked(Boolean(thread.isBookmarked));
  }, [thread.isBookmarked]);

  useEffect(() => {
    setImageUrl(thread.imageUrl);
    setEditImageUrl(thread.imageUrl);
  }, [thread.imageUrl]);

  const isAuthor = Boolean(
    (user?.id && thread.authorId && user.id === thread.authorId) ||
    (thread.author && (profile?.full_name === thread.author || (user?.user_metadata?.full_name as string) === thread.author))
  );
  const isAdmin = profile?.role === "admin";
  const canEdit = isAuthor || isAdmin;

  const handleSave = async () => {
    if (!editContent.trim() || editContent === "<p></p>" || coverError) return;
    const prevContent = content;
    let uploadedImageUrl: string | undefined;
    setIsSaving(true);
    try {
      if (editCoverFile) {
        if (!user?.id) {
          throw new Error("Please sign in before uploading a forum cover image.");
        }
        uploadedImageUrl = await uploadForumImage(editCoverFile, user.id);
      }
      const nextImageUrl = uploadedImageUrl || editImageUrl;
      const updates: PostUpdates = {
        body: editContent,
        image_url: nextImageUrl || null,
      };

      if (onUpdate) {
        await onUpdate(updates);
      } else {
        await forumService.updatePost(thread.id, updates);
      }
      setContent(editContent);
      setImageUrl(nextImageUrl);
      setEditImageUrl(nextImageUrl);
      setEditCoverFile(null);
      setIsEditing(false);

      if (imageUrl && imageUrl !== nextImageUrl && user?.id) {
        void deleteForumImage(imageUrl, user.id).catch((err) => {
          logger.warn("Failed to clean up previous forum cover:", err);
        });
      }
    } catch (err) {
      logger.error("Failed to update post:", err);
      setContent(prevContent);
      if (uploadedImageUrl && user?.id) {
        void deleteForumImage(uploadedImageUrl, user.id).catch((cleanupError) => {
          logger.warn("Failed to clean up unused forum cover:", cleanupError);
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setEditImageUrl(imageUrl);
    setEditCoverFile(null);
    setCoverError("");
    setIsEditing(false);
  };

  const handleCoverSelection = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      setCoverError("Please choose a JPG, PNG, or WebP image.");
      setEditCoverFile(null);
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setCoverError("Cover image must be 5 MB or smaller.");
      setEditCoverFile(null);
      return;
    }

    setEditCoverFile(file);
    setCoverError("");
  };

  const handleToggleBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      if (onBookmark) {
        onBookmark();
      } else {
        await forumService.toggleBookmark(thread.id);
      }
    } catch (err) {
      logger.warn("Failed to toggle bookmark:", err);
      setIsBookmarked(!nextState);
    }
  };

  const handleReportSubmit = async (reason: string) => {
    const success = await forumService.reportContent("post", thread.id, reason);
    if (success) {
      alert("Report submitted successfully.");
      setIsReportModalOpen(false);
    } else {
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <article className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden">
      {/* Author row */}
      <div className="flex items-start justify-between gap-3 md:gap-4 p-4 md:p-5 pb-0">
        <div className="flex items-start gap-3 md:gap-4 min-w-0">
          <div className="shrink-0">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-background-200">
              <img
                src={thread.authorAvatar}
                alt={thread.author}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-sm md:text-base text-foreground-900 font-semibold">
                {thread.author}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background-100 text-foreground-500 text-[10px] md:text-xs rounded-full font-medium">
                {thread.authorRole}
              </span>
            </div>
            <p className="text-xs text-foreground-400 mt-0.5">{thread.postedAt}</p>
          </div>
        </div>

        {/* Edit Button for Author / Admin */}
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditContent(content);
              setEditImageUrl(imageUrl);
              setEditCoverFile(null);
              setCoverError("");
              setIsEditing(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-600 hover:text-primary-600 hover:bg-background-100 border border-background-200 transition-colors cursor-pointer"
            aria-label="Edit post"
          >
            <i className="ri-edit-line text-sm"></i>
            <span>Edit</span>
          </button>
        )}
      </div>

      {imageUrl && (
        <div className="px-4 md:px-5 pt-4">
          <div className="overflow-hidden rounded-xl bg-background-100">
            <img
              src={imageUrl}
              alt={`${thread.title} cover`}
              className="max-h-[32rem] w-full object-cover"
              decoding="async"
            />
          </div>
        </div>
      )}

      {/* Post content or Edit Mode */}
      <div className="px-4 md:px-5 py-4">
        {isEditing ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-background-200 bg-background-50 p-3">
              {(editCoverFile || editImageUrl) && (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground-700">Current cover</p>
                    <p className="truncate text-xs text-foreground-400">
                      {editCoverFile?.name || editImageUrl}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCoverFile(null);
                      setEditImageUrl(undefined);
                      setCoverError("");
                    }}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    aria-label="Remove cover"
                  >
                    Remove
                  </button>
                </div>
              )}
              <label
                htmlFor="edit-post-cover"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-background-200 bg-white px-3 py-2 text-xs font-medium text-foreground-700 hover:bg-background-100 transition-colors"
              >
                <i className="ri-image-edit-line"></i>
                {editCoverFile || editImageUrl ? "Replace cover image" : "Add cover image"}
              </label>
              <input
                id="edit-post-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Replace cover image"
                onChange={(event) => handleCoverSelection(event.target.files?.[0])}
              />
              {coverError && <p className="mt-2 text-xs text-red-600">{coverError}</p>}
            </div>

            <RichTextEditor
              value={editContent}
              onChange={setEditContent}
              placeholder="Edit your post..."
              userId={user?.id}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg border border-background-200 text-xs font-medium text-foreground-600 hover:bg-background-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !editContent.trim() || Boolean(coverError)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-500 text-white text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {isSaving && <i className="ri-loader-4-line animate-spin text-sm"></i>}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none text-foreground-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeForumHtml(content) }}
          />
        )}
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

        {/* Bookmark button */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isBookmarked
              ? "text-teal-600 bg-teal-50 font-semibold"
              : "text-foreground-400 hover:text-teal-600 hover:bg-background-100"
          }`}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
        >
          <i className={`${isBookmarked ? "ri-bookmark-fill" : "ri-bookmark-line"} text-sm`}></i>
          <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Save"}</span>
        </button>

        {/* Report button */}
        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-400 hover:text-rose-500 hover:bg-background-100 transition-all cursor-pointer"
          aria-label="Report post"
        >
          <i className="ri-flag-line text-sm"></i>
          <span className="hidden sm:inline">Report</span>
        </button>

        <button
          onClick={onShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-all ml-auto cursor-pointer"
        >
          <i className="ri-share-line text-sm"></i>
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </article>
  );
}
