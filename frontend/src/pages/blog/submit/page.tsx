import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import ArticleContentRenderer from "@/components/article/ArticleContentRenderer";
import { BLOG_CATEGORIES } from "@/pages/blog/blog.constants";
import { useAuth } from "@/context/AuthContext";
import { blogService, type BlogTag } from "@/api-services/blog.service";
import { logger } from "@/lib/logger";
import { ApiError } from "@/lib/api-client";
import { deleteBlogImage, uploadBlogImage } from "@/api-services/storage.service";

const MAX_COVER_SIZE = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type FieldErrors = Partial<Record<"title" | "content" | "videoUrl", string>>;

const getSubmissionErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return "Failed to submit post. Please try again later.";
  }
  if (error.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (error.status === 429) {
    return "You have submitted too many posts. Please try again later.";
  }
  if (error.status === 400 || error.status === 422) {
    return "Some fields are invalid. Please review your post and try again.";
  }
  if (error.status === 0 || error.status >= 500) {
    return "The server is currently unavailable. Please try again later.";
  }
  return "Failed to submit post. Please try again later.";
};

export default function BlogSubmitPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(BLOG_CATEGORIES[0]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [coverError, setCoverError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    blogService
      .getTags()
      .then((fetchedTags) => {
        if (Array.isArray(fetchedTags)) {
          setTags(fetchedTags);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog tags:", err);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const selectCoverFile = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      setCoverFile(null);
      setCoverError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      setCoverFile(null);
      setCoverError("Cover image must be 5 MB or smaller.");
      return;
    }

    setCoverError("");
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverPreviewUrl("");
    setCoverError("");
  };

  const replaceContentSelection = (
    before: string,
    after: string,
    placeholder: string
  ) => {
    const input = contentInputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selectedText = content.slice(start, end) || placeholder;
    const replacement = `${before}${selectedText}${after}`;
    setContent(`${content.slice(0, start)}${replacement}${content.slice(end)}`);
    setFieldErrors((prev) => ({ ...prev, content: undefined }));

    requestAnimationFrame(() => {
      input.focus();
      const selectionStart = start + before.length;
      input.setSelectionRange(selectionStart, selectionStart + selectedText.length);
    });
  };

  const prefixSelectedLines = (prefix: string) => {
    const input = contentInputRef.current;
    if (!input) return;
    const start = content.lastIndexOf("\n", Math.max(0, input.selectionStart - 1)) + 1;
    const nextLineBreak = content.indexOf("\n", input.selectionEnd);
    const end = nextLineBreak === -1 ? content.length : nextLineBreak;
    const selectedLines = content.slice(start, end) || "List item";
    const replacement = selectedLines
      .split("\n")
      .map((line, index) =>
        prefix === "1. " ? `${index + 1}. ${line}` : `${prefix}${line}`
      )
      .join("\n");
    setContent(`${content.slice(0, start)}${replacement}${content.slice(end)}`);
    setFieldErrors((prev) => ({ ...prev, content: undefined }));

    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start, start + replacement.length);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextFieldErrors: FieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedVideoUrl = videoUrl.trim();

    if (!trimmedTitle) nextFieldErrors.title = "Please enter a post title.";
    else if (trimmedTitle.length > 150)
      nextFieldErrors.title = "Post title must be 150 characters or fewer.";

    if (trimmedContent.length < 10)
      nextFieldErrors.content = "Content must be at least 10 characters.";
    else if (trimmedContent.length > 100000)
      nextFieldErrors.content = "Content must be 100,000 characters or fewer.";

    if (trimmedVideoUrl) {
      try {
        const parsedUrl = new URL(trimmedVideoUrl);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          nextFieldErrors.videoUrl = "Please enter a valid HTTP or HTTPS URL.";
        }
      } catch {
        nextFieldErrors.videoUrl = "Please enter a valid HTTP or HTTPS URL.";
      }
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setIsSubmitting(true);
    setErrorMsg("");

    let uploadedCoverUrl = "";
    let failureStage: "upload" | "submit" = "upload";

    try {
      if (coverFile) {
        if (!user?.id) {
          throw new ApiError("Authentication required", 401, "Unauthorized");
        }
        uploadedCoverUrl = await uploadBlogImage(coverFile, user.id);
      }

      failureStage = "submit";
      await blogService.submitGuide({
        title: trimmedTitle,
        category,
        content: trimmedContent,
        tags: selectedTagIds,
        video_url: trimmedVideoUrl || undefined,
        media_urls: uploadedCoverUrl ? [uploadedCoverUrl] : undefined,
      });
      setSubmittedSuccess(true);
    } catch (error) {
      if (uploadedCoverUrl && user?.id) {
        try {
          await deleteBlogImage(uploadedCoverUrl, user.id);
        } catch (cleanupError) {
          logger.warn("Failed to clean up uploaded blog cover:", cleanupError);
        }
      }
      setErrorMsg(
        failureStage === "upload"
          ? error instanceof ApiError && error.status === 401
            ? getSubmissionErrorMessage(error)
            : "Cover image upload failed. Please try again or remove the image."
          : getSubmissionErrorMessage(error)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="print-hide">
        <Navbar />
      </div>
      <main className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-20 bg-background-50 min-h-[80vh]">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link
              to="/"
              className="text-foreground-500 hover:text-foreground-700 text-sm transition-colors underline underline-offset-2"
            >
              Home
            </Link>
            <i className="ri-arrow-right-s-line text-foreground-400 text-sm"></i>
            <Link
              to="/blog"
              className="text-foreground-500 hover:text-foreground-700 text-sm transition-colors underline underline-offset-2"
            >
              Blog
            </Link>
            <i className="ri-arrow-right-s-line text-foreground-400 text-sm"></i>
            <span className="text-foreground-900 text-sm font-medium">Submit Post</span>
          </div>

          {submittedSuccess ? (
            <div className="bg-white rounded-2xl border border-background-200 p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl mb-4">
                <i className="ri-checkbox-circle-line"></i>
              </div>
              <h2 className="font-heading text-2xl text-foreground-900 mb-2">
                Post Submitted for Review!
              </h2>
              <p className="text-sm text-foreground-600 max-w-md mx-auto leading-relaxed mb-6">
                Thank you for contributing! Our editorial team will review your post and publish it to the blog shortly.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/blog"
                  className="px-6 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
                >
                  Back to Blog
                </Link>
                <button
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setTitle("");
                    setContent("");
                    clearCoverFile();
                    setVideoUrl("");
                    setCategory(BLOG_CATEGORIES[0]);
                    setSelectedTagIds([]);
                    setFieldErrors({});
                    setErrorMsg("");
                    setEditorMode("write");
                  }}
                  className="px-6 py-2.5 rounded-full border border-foreground-200 hover:bg-background-100 text-foreground-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-background-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 md:px-8 py-5 border-b border-foreground-100 bg-background-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                    <i className="ri-quill-pen-line text-xl"></i>
                  </div>
                  <div>
                    <h1 className="font-heading text-lg md:text-xl text-foreground-900">
                      Submit Blog Post
                    </h1>
                    <p className="text-xs text-foreground-500">
                      Share your Alanya stories, tips, and experiences with the community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                      <i className="ri-error-warning-line text-lg flex-shrink-0"></i>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="blog-post-title"
                      className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5"
                    >
                      Post Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="blog-post-title"
                      type="text"
                      value={title}
                      aria-invalid={Boolean(fieldErrors.title)}
                      aria-describedby={fieldErrors.title ? "blog-post-title-error" : undefined}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      placeholder="e.g., Hidden Gems in Alanya Old Town"
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                    />
                    {fieldErrors.title && (
                      <p id="blog-post-title-error" className="mt-1.5 text-xs text-rose-600">
                        {fieldErrors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="blog-category"
                      className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5"
                    >
                      Category
                    </label>
                    <select
                      id="blog-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white cursor-pointer transition-all"
                    >
                      {BLOG_CATEGORIES.map((blogCategory) => (
                        <option key={blogCategory} value={blogCategory}>
                          {blogCategory}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset>
                    <legend className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Tags <span className="font-normal normal-case text-foreground-400">(up to 5)</span>
                    </legend>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          const isDisabled = !isSelected && selectedTagIds.length >= 5;
                          return (
                            <label
                              key={tag.id}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                                isSelected
                                  ? "border-primary-400 bg-primary-50 text-primary-700"
                                  : "border-background-300 text-foreground-600"
                              } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() =>
                                  setSelectedTagIds((previous) =>
                                    isSelected
                                      ? previous.filter((id) => id !== tag.id)
                                      : [...previous, tag.id]
                                  )
                                }
                                className="accent-primary-500"
                              />
                              {tag.name}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-foreground-400">No tags are available.</p>
                    )}
                  </fieldset>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label
                        htmlFor="blog-post-content"
                        className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider"
                      >
                        Content <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className="inline-flex rounded-lg border border-background-300 bg-background-50 p-0.5"
                        aria-label="Content editor mode"
                      >
                        <button
                          type="button"
                          onClick={() => setEditorMode("write")}
                          aria-pressed={editorMode === "write"}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            editorMode === "write"
                              ? "bg-white text-foreground-900 shadow-sm"
                              : "text-foreground-500 hover:text-foreground-800"
                          }`}
                        >
                          Write
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode("preview")}
                          aria-pressed={editorMode === "preview"}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            editorMode === "preview"
                              ? "bg-white text-foreground-900 shadow-sm"
                              : "text-foreground-500 hover:text-foreground-800"
                          }`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    {editorMode === "write" ? (
                      <div>
                        <div
                          className="flex flex-wrap items-center gap-1 rounded-t-xl border border-b-0 border-background-300 bg-background-50 p-2"
                          aria-label="Markdown formatting"
                        >
                          <button
                            type="button"
                            onClick={() => prefixSelectedLines("## ")}
                            aria-label="Heading 2"
                            title="Heading 2"
                            className="rounded px-2 py-1 text-xs font-semibold text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onClick={() => prefixSelectedLines("### ")}
                            aria-label="Heading 3"
                            title="Heading 3"
                            className="rounded px-2 py-1 text-xs font-semibold text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            H3
                          </button>
                          <span className="mx-1 h-5 w-px bg-background-300" />
                          <button
                            type="button"
                            onClick={() => replaceContentSelection("**", "**", "bold text")}
                            aria-label="Bold"
                            title="Bold"
                            className="rounded px-2 py-1 text-xs font-bold text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            B
                          </button>
                          <button
                            type="button"
                            onClick={() => replaceContentSelection("*", "*", "italic text")}
                            aria-label="Italic"
                            title="Italic"
                            className="rounded px-2 py-1 text-xs italic text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            I
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              replaceContentSelection("[", "](https://example.com)", "link text")
                            }
                            aria-label="Link"
                            title="Link"
                            className="rounded px-2 py-1 text-xs text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            <i className="ri-link" />
                          </button>
                          <span className="mx-1 h-5 w-px bg-background-300" />
                          <button
                            type="button"
                            onClick={() => prefixSelectedLines("- ")}
                            aria-label="Bulleted list"
                            title="Bulleted list"
                            className="rounded px-2 py-1 text-xs text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            <i className="ri-list-unordered" />
                          </button>
                          <button
                            type="button"
                            onClick={() => prefixSelectedLines("1. ")}
                            aria-label="Numbered list"
                            title="Numbered list"
                            className="rounded px-2 py-1 text-xs text-foreground-600 hover:bg-white hover:text-foreground-900"
                          >
                            <i className="ri-list-ordered-2" />
                          </button>
                        </div>
                        <textarea
                          ref={contentInputRef}
                          id="blog-post-content"
                        rows={8}
                        value={content}
                        aria-invalid={Boolean(fieldErrors.content)}
                        aria-describedby={fieldErrors.content ? "blog-post-content-error" : undefined}
                        onChange={(e) => {
                          setContent(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, content: undefined }));
                        }}
                        placeholder="Write your blog post content here. Share your experiences, tips, and recommendations..."
                          className="w-full px-4 py-2.5 rounded-b-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all resize-y"
                        />
                      </div>
                    ) : (
                      <div className="min-h-48 rounded-xl border border-background-300 bg-background-50 px-4 py-3">
                        {content.trim() ? (
                          <ArticleContentRenderer content={content} />
                        ) : (
                          <p className="text-sm text-foreground-400">Nothing to preview yet.</p>
                        )}
                      </div>
                    )}
                    {fieldErrors.content && (
                      <p id="blog-post-content-error" className="mt-1.5 text-xs text-rose-600">
                        {fieldErrors.content}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Cover Image
                    </label>
                    <input
                      id="blog-cover-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Cover image"
                      className="sr-only"
                      onChange={(event) => selectCoverFile(event.target.files?.[0])}
                    />
                    {coverPreviewUrl ? (
                      <div className="relative overflow-hidden rounded-xl border border-background-300">
                        <img
                          src={coverPreviewUrl}
                          alt="Cover preview"
                          className="h-48 w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-foreground-950/70 px-4 py-3 text-white">
                          <span className="truncate text-xs">{coverFile?.name}</span>
                          <button
                            type="button"
                            onClick={clearCoverFile}
                            className="text-xs font-medium hover:text-primary-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="blog-cover-image"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-background-300 px-4 py-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/40"
                      >
                        <i className="ri-image-add-line mb-2 text-2xl text-primary-500"></i>
                        <span className="text-sm font-medium text-foreground-700">Choose cover image</span>
                        <span className="mt-1 text-xs text-foreground-400">JPG, PNG or WebP · max 5 MB</span>
                      </label>
                    )}
                    {coverError && <p className="mt-1.5 text-xs text-rose-600">{coverError}</p>}
                  </div>

                  <div>
                    <label
                      htmlFor="blog-video-url"
                      className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5"
                    >
                      Video URL (Optional)
                    </label>
                    <input
                      id="blog-video-url"
                      type="url"
                      value={videoUrl}
                      aria-invalid={Boolean(fieldErrors.videoUrl)}
                      aria-describedby={fieldErrors.videoUrl ? "blog-video-url-error" : undefined}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, videoUrl: undefined }));
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                    />
                    {fieldErrors.videoUrl && (
                      <p id="blog-video-url-error" className="mt-1.5 text-xs text-rose-600">
                        {fieldErrors.videoUrl}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground-100">
                    <Link
                      to="/blog"
                      className="px-5 py-2.5 rounded-full border border-background-300 hover:bg-background-100 text-foreground-700 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <i className="ri-loader-4-line animate-spin text-base"></i>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <i className="ri-send-plane-fill text-base"></i>
                          <span>Submit Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="print-hide">
        <Footer />
      </div>
    </>
  );
}
