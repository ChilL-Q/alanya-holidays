import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { blogService, type BlogTag } from "@/api-services/blog.service";
import { logger } from "@/lib/logger";

export default function BlogSubmitPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    blogService
      .getTags()
      .then((fetchedTags) => {
        if (Array.isArray(fetchedTags) && fetchedTags.length > 0) {
          setTags(fetchedTags);
          setCategory((prev) => prev || fetchedTags[0].name);
        }
      })
      .catch((err) => {
        logger.warn("Failed to fetch blog tags:", err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Please provide both a title and content.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await blogService.submitGuide({
        title: title.trim(),
        category,
        content: content.trim(),
        tags: category ? [category] : [],
        video_url: videoUrl.trim() || undefined,
        media_urls: coverImageUrl.trim() ? [coverImageUrl.trim()] : undefined,
      });
      setSubmittedSuccess(true);
    } catch {
      setErrorMsg("Failed to submit post. Please try again later.");
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
                    setCoverImageUrl("");
                    setVideoUrl("");
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
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                      <i className="ri-error-warning-line text-lg flex-shrink-0"></i>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Post Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Hidden Gems in Alanya Old Town"
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white cursor-pointer transition-all"
                    >
                      {tags.length > 0 ? (
                        tags.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Essential">Essential</option>
                          <option value="Food & Drink">Food & Drink</option>
                          <option value="Adventure">Adventure</option>
                          <option value="Expats">Expats</option>
                          <option value="Beaches">Beaches</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Content <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={8}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your blog post content here. Share your experiences, tips, and recommendations..."
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all resize-y"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                      Video URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                    />
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
