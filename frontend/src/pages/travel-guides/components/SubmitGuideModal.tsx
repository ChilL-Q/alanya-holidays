import { useState, useEffect } from "react";
import { blogService, type BlogTag } from "@/api-services/blog.service";

interface SubmitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags?: BlogTag[];
  onSubmitted?: () => void;
}

export default function SubmitGuideModal({
  isOpen,
  onClose,
  tags = [],
  onSubmitted,
}: SubmitGuideModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Essential");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setCategory(tags[0]?.name || "Essential");
      setAuthorName("");
      setAuthorEmail("");
      setContent("");
      setIsSubmitting(false);
      setSubmittedSuccess(false);
      setErrorMsg("");
    }
  }, [isOpen, tags]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Please provide both a title and guide content.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      await blogService.submitGuide({
        title: title.trim(),
        category,
        author_name: authorName.trim() || "Community Member",
        author_email: authorEmail.trim() || undefined,
        content: content.trim(),
        tags: [category],
      });

      setSubmittedSuccess(true);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch {
      setErrorMsg("Failed to submit guide. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-guide-modal-title"
    >
      <div
        className="fixed inset-0 bg-foreground-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-foreground-100 bg-background-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <i className="ri-quill-pen-line text-xl"></i>
            </div>
            <div>
              <h2
                id="submit-guide-modal-title"
                className="font-heading text-lg md:text-xl text-foreground-900"
              >
                Submit Community Guide
              </h2>
              <p className="text-xs text-foreground-500">
                Share your local insider tips with Alanya travelers and expats.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-background-200/60 text-foreground-400 hover:text-foreground-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {submittedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                <i className="ri-checkbox-circle-line"></i>
              </div>
              <h3 className="font-heading text-2xl text-foreground-900">
                Guide Submitted for Review!
              </h3>
              <p className="text-sm text-foreground-600 max-w-md mx-auto leading-relaxed">
                Thank you for contributing! Our editorial team will review your guide shortly and publish it to the community page.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  Back to Guides
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                  <i className="ri-error-warning-line text-lg flex-shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                  Guide Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Hidden Waterfalls Near Alanya"
                  className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <option value="Nightlife">Nightlife</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name or alias"
                    className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="For notifications when published"
                  className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground-700 uppercase tracking-wider mb-1.5">
                  Guide Content & Recommendations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share directions, tips, what to pack, pricing, and why travelers should visit..."
                  className="w-full px-4 py-2.5 rounded-xl border border-background-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm text-foreground-900 bg-white placeholder:text-foreground-400 transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full border border-background-300 hover:bg-background-100 text-foreground-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
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
                      <span>Submit Guide</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
