import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { forumService, type Category } from "@/api-services/forum.service";
import { deleteForumImage, uploadForumImage } from "@/api-services/storage.service";
import { useAuth } from "@/context/AuthContext";
import { logger } from "@/lib/logger";
import RichTextEditor from "@/components/base/RichTextEditor";

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function ThreadForm() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdThread, setCreatedThread] = useState<{ id: string; slug: string; title: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load dynamic categories
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCategories(true);
    forumService
      .getCategories()
      .then((cats) => {
        if (isMounted && cats) {
          setCategoriesList(cats);
        }
      })
      .catch((err) => {
        logger.warn("Failed to load categories in ThreadForm:", err);
        if (isMounted) {
          setCategoriesList([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Normalize the initial category from URL against backend taxonomy.
  useEffect(() => {
    if (!initialCategory) return;
    if (categoriesList.length === 0) return;

    const matchedCategory = categoriesList.find(
      (c) => c.id === initialCategory || c.slug === initialCategory
    );

    setCategoryId(matchedCategory?.id || "");
  }, [initialCategory, categoriesList]);

  const selectedCategory = useMemo(
    () => categoriesList.find((c) => c.id === categoryId) ?? null,
    [categoryId, categoriesList]
  );

  const subcategories = useMemo(
    () => selectedCategory?.subcategories ?? [],
    [selectedCategory]
  );

  useEffect(() => {
    if (subcategories.length === 0) {
      if (subcategory) {
        setSubcategory("");
      }
      return;
    }

    if (subcategory && !subcategories.includes(subcategory)) {
      setSubcategory("");
    }
  }, [subcategory, subcategories]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const selectCoverFile = (file: File | undefined) => {
    if (!file) return;

    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      setCoverFile(null);
      setCoverPreviewUrl("");
      setErrors((prev) => ({
        ...prev,
        coverImage: "Please choose a JPG, PNG, or WebP image.",
      }));
      return;
    }

    if (file.size > MAX_COVER_SIZE) {
      setCoverFile(null);
      setCoverPreviewUrl("");
      setErrors((prev) => ({
        ...prev,
        coverImage: "Cover image must be 5 MB or smaller.",
      }));
      return;
    }

    const previewUrl = typeof URL.createObjectURL === "function"
      ? URL.createObjectURL(file)
      : "";
    setCoverFile(file);
    setCoverPreviewUrl(previewUrl);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.coverImage;
      return next;
    });
  };

  const removeCoverFile = () => {
    setCoverFile(null);
    setCoverPreviewUrl("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.coverImage;
      return next;
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSubcategory("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.categoryId;
      delete next.subcategory;
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedMediaUrl = mediaUrl.trim();

    if (!categoryId.trim()) errs.categoryId = "Please pick a category for your post.";
    if (!trimmedTitle) errs.title = "Please enter a title for your post.";
    if (!trimmedContent) errs.content = "Please share a short description or story.";

    if (trimmedMediaUrl) {
      try {
        new URL(trimmedMediaUrl);
      } catch {
        errs.mediaUrl = "Please enter a valid media URL (https://…).";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    let uploadedImageUrl: string | undefined;
    try {
      if (coverFile) {
        if (!user?.id) {
          throw new Error("Please sign in before uploading a forum cover image.");
        }
        setIsUploadingImage(true);
        uploadedImageUrl = await uploadForumImage(coverFile, user.id);
        setIsUploadingImage(false);
      }

      const res = await forumService.createThread({
        title: title.trim(),
        body: content.trim(),
        category_id: categoryId,
        subcategory: subcategory || undefined,
        image_url: uploadedImageUrl,
      });
      setCreatedThread({
        id: res.id,
        slug: res.slug || res.id,
        title: res.title,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      logger.warn("Failed to create thread:", err);
      if (uploadedImageUrl && user?.id) {
        void deleteForumImage(uploadedImageUrl, user.id).catch((cleanupError) => {
          logger.warn("Failed to clean up unused forum cover:", cleanupError);
        });
      }
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create thread. Please check your inputs and try again.";
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setIsUploadingImage(false);
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-background-50 rounded-2xl border border-background-200/70 p-8 md:p-12 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary-100 rounded-full">
          <i className="ri-check-line text-3xl text-primary-500"></i>
        </div>
        <h3 className="font-heading text-xl md:text-2xl text-foreground-900 mb-3">
          Discussion Created!
        </h3>
        <p className="text-sm md:text-base text-foreground-600 mb-8 max-w-md mx-auto">
          Your thread has been posted to the{" "}
          <span className="font-medium text-foreground-900">
            {selectedCategory?.name}
          </span>
          {subcategory ? (
            <span>
              {" "}
              → Topic:{" "}
              <span className="font-medium text-foreground-900">{subcategory}</span>
            </span>
          ) : (
            ""
          )}{" "}
          category. Others can now see it and join the conversation.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {createdThread && (
            <Link
              to={`/thread/${createdThread.slug || createdThread.id}`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              View Your Thread
              <i className="ri-arrow-right-line"></i>
            </Link>
          )}
          <Link
            to={`/category/${selectedCategory?.slug || categoryId}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap"
          >
            View in {selectedCategory?.name}
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setCreatedThread(null);
              setCategoryId("");
              setSubcategory("");
              setTitle("");
              setContent("");
              setMediaUrl("");
              removeCoverFile();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line"></i>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-background-200/70 p-6 md:p-8 max-w-2xl mx-auto space-y-5 shadow-sm"
    >
      {errors.submit && (
        <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          {errors.submit}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="thread-category"
            className="block text-sm font-semibold text-foreground-800 dark:text-background-200 mb-2"
          >
            Category *
          </label>
          <select
            id="thread-category"
            name="category"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={isLoadingCategories || categoriesList.length === 0}
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              errors.categoryId ? "border-primary-500" : "border-background-200"
            }`}
          >
            <option value="" disabled>
              {isLoadingCategories
                ? "Loading categories…"
                : categoriesList.length === 0
                  ? "No categories available right now"
                  : "Choose a category…"}
            </option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-2 text-xs text-primary-500">{errors.categoryId}</p>
          )}
          {categoriesList.length === 0 && !isLoadingCategories && (
            <p className="mt-2 text-xs text-foreground-500">
              We couldn't load any forum categories. Please try again later.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="thread-subcategory"
            className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-2"
          >
            Topic <span className="text-foreground-400">(optional)</span>
          </label>
          <select
            id="thread-subcategory"
            name="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={isLoadingCategories || subcategories.length === 0}
            className="w-full px-4 py-2.5 rounded-xl border border-background-200 bg-white text-foreground-900 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">
              {subcategories.length === 0
                ? "Select a category first"
                : "All topics in this category"}
            </option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="thread-title"
            className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
          >
            Title *
          </label>
          <input
            id="thread-title"
            type="text"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.title;
                  return next;
                });
              }
            }}
            placeholder="e.g. Hidden Cleopatra Beach Sunset Cove"
            maxLength={140}
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.title ? "border-primary-500" : "border-background-200"
            }`}
          />
          {errors.title && (
            <p className="mt-2 text-xs text-primary-500">{errors.title}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="thread-content"
            className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
          >
            Story *
          </label>
          <RichTextEditor
            inputId="thread-content"
            ariaLabel="Story"
            value={content}
            onChange={(value) => {
              setContent(value);
              if (errors.content) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.content;
                  return next;
                });
              }
            }}
            placeholder="Tell the community what makes this spot special, share tips, or ask a question…"
          />
          {errors.content && (
            <p className="mt-2 text-xs text-primary-500">{errors.content}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="thread-cover-image"
            className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
          >
            Cover Image <span className="text-xs text-foreground-400">(optional)</span>
          </label>

          {coverFile ? (
            <div className="relative overflow-hidden rounded-xl border border-background-200 bg-background-50">
              {coverPreviewUrl ? (
                <img
                  src={coverPreviewUrl}
                  alt="Cover preview"
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center px-4 text-sm text-foreground-600">
                  {coverFile.name}
                </div>
              )}
              <button
                type="button"
                onClick={removeCoverFile}
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground-950/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-foreground-950/85 transition-colors cursor-pointer"
              >
                <i className="ri-delete-bin-line"></i>
                Remove
              </button>
            </div>
          ) : (
            <label
              htmlFor="thread-cover-image"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectCoverFile(event.dataTransfer.files[0]);
              }}
              className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-5 text-center transition-colors hover:bg-background-50 ${
                errors.coverImage ? "border-primary-500 bg-primary-50/40" : "border-background-300"
              }`}
            >
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <i className="ri-image-add-line text-xl"></i>
              </span>
              <span className="text-sm font-medium text-foreground-800">
                Drop an image here or choose a file
              </span>
              <span className="mt-1 text-xs text-foreground-400">
                JPG, PNG or WebP · max 10 MB
              </span>
            </label>
          )}

          <input
            id="thread-cover-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => selectCoverFile(event.target.files?.[0])}
          />
          {errors.coverImage && (
            <p className="mt-2 text-xs text-primary-500">{errors.coverImage}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="thread-media-url"
            className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
          >
            Media URL <span className="text-xs text-foreground-400">(optional — YouTube, Drive, Instagram)</span>
          </label>
          <input
            id="thread-media-url"
            type="url"
            name="mediaUrl"
            value={mediaUrl}
            onChange={(e) => {
              setMediaUrl(e.target.value);
              if (errors.mediaUrl) {
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.mediaUrl;
                  return next;
                });
              }
            }}
            placeholder="https://…"
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-foreground-900 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.mediaUrl ? "border-primary-500" : "border-background-200"
            }`}
          />
          {errors.mediaUrl && (
            <p className="mt-2 text-xs text-primary-500">{errors.mediaUrl}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-foreground-500 bg-background-100/70 rounded-lg px-4 py-2.5">
        <i className="ri-information-line"></i>
        <span>
          Write a clear title and detailed description. Well-written posts get more replies!
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isLoadingCategories}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <i className="ri-loader-4-line animate-spin"></i>
            {isUploadingImage ? "Uploading image…" : "Publishing…"}
          </>
        ) : (
          <>
            Publish Post
            <i className="ri-send-plane-fill"></i>
          </>
        )}
      </button>
    </form>
  );
}