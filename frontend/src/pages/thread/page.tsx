import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { forumService, type ThreadDetail, type ThreadReply } from "@/api-services/forum.service";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import ThreadHero from "./components/ThreadHero";
import OriginalPost from "./components/OriginalPost";
import ReplyCard from "./components/ReplyCard";
import ReplyInput from "./components/ReplyInput";
import AuthorSidebar from "./components/AuthorSidebar";
import ErrorState from "@/components/base/ErrorState";
import { logger } from "@/lib/logger";

export default function ThreadPage() {
  const { threadId } = useParams<{ threadId: string }>();

  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replies, setReplies] = useState<ThreadReply[]>([]);
  const [replyTarget, setReplyTarget] = useState<{ id: string; author: string } | null>(null);
  const [shareToast, setShareToast] = useState(false);
  const replySectionRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    if (!threadId) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const data = await forumService.getThreadById(threadId);
      if (data) {
        setThread(data);
        setLiked(data.isLiked);
        setLikeCount(data.likes);
        setReplies(data.replies || []);
        forumService.incrementPostView(data.id);
      } else {
        setThread(null);
      }
    } catch {
      setFetchError("Unable to load discussion. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-background-200/70 p-8 text-center animate-pulse space-y-4">
            <div className="h-6 bg-background-200 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-background-100 rounded w-1/3 mx-auto" />
            <div className="h-32 bg-background-100 rounded w-full mt-4" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <ErrorState
            title="Failed to load thread"
            message={fetchError}
            onRetry={loadThread}
          />
        </div>
        <Footer />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-background-100 rounded-full">
              <i className="ri-chat-off-line text-2xl text-foreground-300"></i>
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">Thread not found</h2>
            <p className="text-sm text-foreground-500 mb-6">
              This discussion might have been moved or deleted.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              <i className="ri-arrow-left-line"></i>
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleLikePost = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await forumService.toggleLike("post", thread.id);
      if (res && typeof res.liked === "boolean") {
        setLiked(res.liked);
        if (typeof res.likesCount === "number") {
          setLikeCount(res.likesCount);
        }
      }
    } catch (err) {
      logger.warn("Failed to toggle post like, rolling back:", err);
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    const prevReplies = replies;
    const updateReplyLikes = (repliesList: ThreadReply[]): ThreadReply[] =>
      repliesList.map((r) => {
        if (r.id === replyId) {
          return {
            ...r,
            isLiked: !r.isLiked,
            likes: r.isLiked ? Math.max(0, r.likes - 1) : r.likes + 1,
          };
        }
        if (r.replies && r.replies.length > 0) {
          return { ...r, replies: updateReplyLikes(r.replies) };
        }
        return r;
      });

    setReplies(updateReplyLikes(replies));

    try {
      await forumService.toggleLike("comment", replyId);
    } catch (err) {
      logger.warn("Failed to toggle reply like, rolling back:", err);
      setReplies(prevReplies);
    }
  };

  const handleReplyClick = (replyId: string) => {
    const findReply = (list: ThreadReply[]): ThreadReply | null => {
      for (const r of list) {
        if (r.id === replyId) return r;
        const found = findReply(r.replies || []);
        if (found) return found;
      }
      return null;
    };
    const target = findReply(replies);
    if (target) {
      setReplyTarget({ id: replyId, author: target.author });
    }
  };

  const scrollToReplies = () => {
    replySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmitReply = async (content: string, parentId: string | null) => {
    try {
      const newReply = await forumService.createComment(thread.id, content, parentId);
      newReply.parentId = parentId;

      if (parentId) {
        const addNestedReply = (list: ThreadReply[]): ThreadReply[] =>
          list.map((r) => {
            if (r.id === parentId) {
              return { ...r, replies: [...(r.replies || []), newReply] };
            }
            if (r.replies && r.replies.length > 0) {
              return { ...r, replies: addNestedReply(r.replies) };
            }
            return r;
          });
        setReplies(addNestedReply);
      } else {
        setReplies((prev) => [...prev, newReply]);
      }
    } catch (err) {
      logger.warn("Failed to submit reply:", err);
    } finally {
      setReplyTarget(null);
    }
  };


  const handleUpdatePost = async (newContent: string) => {
    await forumService.updatePost(thread.id, { body: newContent });
    setThread((prev) => (prev ? { ...prev, content: newContent } : null));
  };

  const handleUpdateReply = async (replyId: string, newContent: string) => {
    await forumService.updateComment(replyId, newContent);
    const updateReplyContent = (list: ThreadReply[]): ThreadReply[] =>
      list.map((r) => {
        if (r.id === replyId) {
          return { ...r, content: newContent };
        }
        if (r.replies && r.replies.length > 0) {
          return { ...r, replies: updateReplyContent(r.replies) };
        }
        return r;
      });
    setReplies(updateReplyContent);
  };

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background-50 flex flex-col">
      <Navbar />

      {/* Toast */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-foreground-900 text-background-50 px-5 py-3 rounded-full text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <i className="ri-check-line mr-1.5"></i>
          Link copied to clipboard!
        </div>
      )}

      <ThreadHero thread={{ ...thread, likes: likeCount, isLiked: liked, replies, isPinned: thread.isPinned, isHot: thread.isHot, isVerified: thread.isVerified, subcategory: thread.subcategory, views: thread.views, postedAt: thread.postedAt, title: thread.title, category: thread.category, categoryId: thread.categoryId }} />

      {/* Main content area */}
      <main className="flex-1 w-full px-4 md:px-8 lg:px-12 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Left: Thread content */}
          <div className="flex-1 min-w-0 space-y-4">
            <OriginalPost
              thread={{ ...thread, likes: likeCount, isLiked: liked, replies, isPinned: thread.isPinned, isHot: thread.isHot, isVerified: thread.isVerified, subcategory: thread.subcategory, views: thread.views, postedAt: thread.postedAt, title: thread.title, category: thread.category, categoryId: thread.categoryId, author: thread.author, content: thread.content, authorAvatar: thread.authorAvatar, authorRole: thread.authorRole, id: thread.id, authorBio: thread.authorBio, authorPosts: thread.authorPosts, authorReputation: thread.authorReputation, authorJoinDate: thread.authorJoinDate, authorLocation: thread.authorLocation, authorBadges: thread.authorBadges }}
              onLike={handleLikePost}
              onShare={handleShare}
              onScrollToReplies={scrollToReplies}
              onUpdate={handleUpdatePost}
            />

            {/* Replies count heading */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="font-heading text-sm md:text-base text-foreground-900">
                Replies{" "}
                <span className="text-foreground-400 font-normal">
                  ({replies.length})
                </span>
              </h3>
            </div>

            {/* Reply list */}
            <div className="space-y-1">
              {replies.length === 0 ? (
                <div className="bg-background-50 rounded-xl border border-background-200/70 p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-background-100 rounded-full">
                    <i className="ri-chat-smile-2-line text-xl text-foreground-300"></i>
                  </div>
                  <p className="text-sm text-foreground-500 mb-2">
                    No replies yet. Be the first to share your thoughts!
                  </p>
                </div>
              ) : (
                replies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    depth={0}
                    onLike={handleLikeReply}
                    onReply={handleReplyClick}
                    onUpdate={handleUpdateReply}
                  />
                ))
              )}
            </div>

            {/* Reply input at bottom */}
            <div ref={replySectionRef}>
              <ReplyInput
                replyTo={replyTarget?.id ?? null}
                replyToAuthor={replyTarget?.author}
                onSubmit={handleSubmitReply}
                onCancel={() => setReplyTarget(null)}
              />
            </div>
          </div>

          {/* Right: Author sidebar */}
          <AuthorSidebar thread={thread} />
        </div>
      </main>

      {/* Bottom CTA */}
      <section className="w-full px-4 md:px-8 lg:px-12 pb-10 md:pb-14">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-8 md:p-10 text-center">
          <h3 className="font-heading text-xl md:text-2xl text-background-50 mb-3">
            Loved this discussion?
          </h3>
          <p className="text-background-50/80 text-sm md:text-base mb-6 max-w-lg mx-auto">
            Join the Alanya Holidays community to participate in conversations, ask questions, and connect with locals and travelers.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-background-50 text-primary-600 text-sm font-medium hover:bg-background-50/90 transition-colors whitespace-nowrap"
            >
              Create Free Account
              <i className="ri-arrow-right-line"></i>
            </Link>
            <Link
              to={`/category/${thread.categoryId}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-background-50/30 text-background-50 text-sm font-medium hover:bg-background-50/10 transition-colors whitespace-nowrap"
            >
              More {thread.category} Threads
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}