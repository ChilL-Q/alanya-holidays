import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { forumService, type Category } from "@/api-services/forum.service";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";
import RichTextEditor from "@/components/base/RichTextEditor";

export interface CommunityPostPayload {
  categoryId: string;
  subcategoryId?: string;
  title: string;
  body: string;
  mediaUrl?: string;
}

interface SubmitContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (payload: CommunityPostPayload) => void;
  initialCategoryId?: string;
  initialCategoryName?: string;
  initialSubcategory?: string;
  fallbackPath?: string;
  lockCategory?: boolean;
}

export default function SubmitContentModal({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialCategoryId,
  initialCategoryName,
  initialSubcategory,
  fallbackPath = "/categories",
  lockCategory = false,
}: SubmitContentModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setBody("");
      setMediaUrl("");
      setErrorMessage("");
      setCategoryId(initialCategoryId || "");
      setSubcategoryId(initialSubcategory || "");
    }
  }, [initialCategoryId, initialSubcategory, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingCategories(true);
    forumService
      .getCategories()
      .then((data) => {
        if (isMounted) setCategories(data || []);
      })
      .catch((err) => {
        logger.warn("Failed to load forum categories:", err);
        if (isMounted) setCategories([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const sortedCategories = useMemo(() => categories, [categories]);

  const selectedCategory = useMemo(
    () => sortedCategories.find((cat) => cat.id === categoryId) || null,
    [categoryId, sortedCategories]
  );

  const availableSubcategories = useMemo(
    () => selectedCategory?.subcategories || [],
    [selectedCategory]
  );

  useEffect(() => {
    if (!isOpen || !selectedCategory) return;

    if (availableSubcategories.length === 0) {
      if (subcategoryId) {
        setSubcategoryId("");
      }
      return;
    }

    if (subcategoryId && !availableSubcategories.includes(subcategoryId)) {
      setSubcategoryId("");
    }
  }, [availableSubcategories, isOpen, selectedCategory, subcategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isAuthenticated) {
      const message = "Please sign in to share a post with the community.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!categoryId) {
      setErrorMessage("Please pick a category for your post.");
      toast.error("Please pick a category for your post.");
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a title for your post.");
      toast.error("Please enter a title for your post.");
      return;
    }

    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setErrorMessage("Please share a short description or story.");
      toast.error("Please share a short description or story.");
      return;
    }

    const trimmedMediaUrl = mediaUrl.trim();
    if (trimmedMediaUrl) {
      try {
        new URL(trimmedMediaUrl);
      } catch {
        setErrorMessage("Please enter a valid media URL (https://…).");
        toast.error("Please enter a valid media URL (https://…).");
        return;
      }
    }

    const trimmedSubcategory = subcategoryId.trim();

    setIsSubmitting(true);
    try {
      const created = await forumService.createThread({
        title: trimmedTitle,
        body: trimmedBody,
        category_id: categoryId,
        subcategory: trimmedSubcategory || undefined,
      });

      const payload: CommunityPostPayload = {
        categoryId,
        subcategoryId: trimmedSubcategory || undefined,
        title: trimmedTitle,
        body: trimmedBody,
        mediaUrl: trimmedMediaUrl || undefined,
      };

      toast.success("Your post was published to the community.");
      if (onSubmitSuccess) onSubmitSuccess(payload);

      setTitle("");
      setBody("");
      setMediaUrl("");
      setSubcategoryId("");
      onClose();

      const slug = (created as { slug?: string } | null)?.slug;
      if (slug) {
        navigate(`/thread/${slug}`);
      } else {
        navigate(fallbackPath);
      }
    } catch (err) {
      logger.error("Community post submission failed:", err);
      const message =
        err instanceof Error && err.message
          ? err.message
          : "We couldn't publish your post. Please try again.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-content-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-background-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-background-100 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                Community
              </span>
              <span className="text-xs text-foreground-500">
                Share with the Alanya community
              </span>
            </div>
            <h2
              id="submit-content-title"
              className="text-xl font-heading font-bold text-foreground-900"
            >
              Share a Post
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground-400 hover:text-foreground-700 hover:bg-background-100 transition-colors"
            aria-label="Close dialog"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
        >
          {!authLoading && !isAuthenticated && (
            <div className="p-3 text-sm rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              You need to be signed in to publish a post.{" "}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/login");
                }}
                className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
              >
                Sign in
              </button>
              .
            </div>
          )}

          {errorMessage && (
            <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="content-category"
                className="block text-sm font-semibold text-foreground-800 dark:text-background-200 mb-2"
              >
                Category *
              </label>
              <select
                id="content-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
                disabled={lockCategory || isLoadingCategories || sortedCategories.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-white text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {!initialCategoryId && (
                  <option value="" disabled>
                    {isLoadingCategories
                      ? "Loading categories…"
                      : sortedCategories.length === 0
                      ? "No categories available right now"
                      : "Choose a category…"}
                  </option>
                )}
                {initialCategoryId &&
                  initialCategoryName &&
                  !sortedCategories.some((cat) => cat.id === initialCategoryId) && (
                    <option value={initialCategoryId}>{initialCategoryName}</option>
                  )}
                {sortedCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {sortedCategories.length === 0 && !isLoadingCategories && (
                <p className="mt-2 text-xs text-foreground-500">
                  We couldn't load any forum categories. Please try again later.
                </p>
              )}
            </div>

            {availableSubcategories.length > 0 && (
              <div>
                <label
                  htmlFor="content-subcategory"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-2"
                >
                  Topic
                </label>
                <select
                  id="content-subcategory"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={isLoadingCategories}
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-white text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">All topics in this category</option>
                  {availableSubcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="content-title"
                className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
              >
                Title *
              </label>
              <input
                id="content-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hidden Cleopatra Beach Sunset Cove"
                className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-white text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                maxLength={140}
              />
            </div>

            <div>
              <label
                htmlFor="content-description"
                className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
              >
                Story *
              </label>
              <RichTextEditor
                inputId="content-description"
                ariaLabel="Story"
                value={body}
                onChange={setBody}
                placeholder="Tell the community what makes this spot special, share tips, or ask a question…"
              />
            </div>

            <div>
              <label
                htmlFor="content-media-url"
                className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
              >
                Media URL <span className="text-xs text-foreground-400">(optional — YouTube, Drive, Instagram)</span>
              </label>
              <input
                id="content-media-url"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
                className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-white text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-background-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-foreground-600 hover:text-foreground-900 rounded-xl hover:bg-background-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingCategories}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Publishing…
                </>
              ) : (
                <>
                  Publish Post
                  <i className="ri-send-plane-fill"></i>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
