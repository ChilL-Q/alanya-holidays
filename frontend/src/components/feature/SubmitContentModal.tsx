import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { blogService } from "@/api-services/blog.service";

export type UgcMediaType = "photo" | "video" | "article" | "tip";

export interface UgcSubmissionPayload {
  mediaType: UgcMediaType;
  title: string;
  description: string;
  mediaUrl?: string;
  fileName?: string;
  authorName: string;
  authorEmail: string;
  payoutMethod: "iban" | "wise" | "crypto" | "credits";
  payoutHandle: string;
  acceptedTerms: boolean;
}

interface SubmitContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess?: (payload: UgcSubmissionPayload) => void;
}

const MEDIA_TYPES: { id: UgcMediaType; label: string; icon: string; reward: string }[] = [
  { id: "photo", label: "Photo", icon: "ri-camera-lens-line", reward: "Up to €50 / ₺1,600" },
  { id: "video", label: "Video", icon: "ri-video-line", reward: "Up to €250 / ₺8,000" },
  { id: "article", label: "Article", icon: "ri-article-line", reward: "Up to €120 / ₺3,800" },
  { id: "tip", label: "Local Tip", icon: "ri-lightbulb-line", reward: "Up to €30 / ₺1,000" },
];

export default function SubmitContentModal({
  isOpen,
  onClose,
  onSubmitSuccess,
}: SubmitContentModalProps) {
  const [mediaType, setMediaType] = useState<UgcMediaType>("photo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"iban" | "wise" | "crypto" | "credits">("iban");
  const [payoutHandle, setPayoutHandle] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset or handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter a title for your content.");
      toast.error("Please enter a title for your content.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please provide a short description or story.");
      toast.error("Please provide a short description or story.");
      return;
    }

    if (!authorName.trim()) {
      setErrorMessage("Please enter your name.");
      toast.error("Please enter your name.");
      return;
    }

    if (!authorEmail.trim() || !authorEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("You must accept the terms to submit content.");
      toast.error("You must accept the terms to submit content.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UgcSubmissionPayload = {
        mediaType,
        title: title.trim(),
        description: description.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        fileName: fileName || undefined,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        payoutMethod,
        payoutHandle: payoutHandle.trim(),
        acceptedTerms,
      };

      await blogService.submitGuide({
        title: payload.title,
        content: payload.description,
        author_name: payload.authorName,
        author_email: payload.authorEmail,
        category: payload.mediaType,
        video_url: payload.mediaType === "video" ? payload.mediaUrl : undefined,
        media_urls: payload.mediaUrl ? [payload.mediaUrl] : [],
        payment_details: {
          method: payload.payoutMethod,
          handle: payload.payoutHandle,
          acceptedTerms: payload.acceptedTerms,
        },
      });

      toast.success("Content submitted! Our editorial team will review it within 48h.");
      if (onSubmitSuccess) {
        onSubmitSuccess(payload);
      }

      // Reset fields
      setTitle("");
      setDescription("");
      setMediaUrl("");
      setFileName("");
      setPayoutHandle("");
      setAcceptedTerms(false);
      onClose();
    } catch {
      toast.error("Submission failed. Please try again.");
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
        className="relative w-full max-w-2xl bg-white dark:bg-background-900 rounded-2xl shadow-2xl border border-background-200 dark:border-background-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-background-100 dark:border-background-800 bg-background-50/50 dark:bg-background-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                Creator Rewards
              </span>
              <span className="text-xs text-foreground-500">Earn up to €250 / submission</span>
            </div>
            <h2
              id="submit-content-title"
              className="text-xl font-heading font-bold text-foreground-900 dark:text-background-50"
            >
              Submit Creator Content
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground-400 hover:text-foreground-700 dark:hover:text-background-100 hover:bg-background-100 dark:hover:bg-background-800 transition-colors"
            aria-label="Close dialog"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-sm rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
              {errorMessage}
            </div>
          )}

          {/* Media Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-foreground-800 dark:text-background-200 mb-2">
              Select Content Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMediaType(type.id)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    mediaType === type.id
                      ? "border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm"
                      : "border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-600 dark:text-background-300 hover:border-background-300 dark:hover:border-background-600"
                  }`}
                  aria-pressed={mediaType === type.id}
                >
                  <i className={`${type.icon} text-2xl mb-1`}></i>
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-[10px] text-foreground-400 dark:text-background-400 mt-0.5">
                    {type.reward}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Details */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="content-title"
                className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
              >
                Content Title *
              </label>
              <input
                id="content-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hidden Cleopatra Beach Sunset Cove Guide"
                className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label
                htmlFor="content-description"
                className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
              >
                Description / Story *
              </label>
              <textarea
                id="content-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what makes this spot special, exact coordinates, or tips for visitors..."
                className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="content-media-url"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Media URL (YouTube, Drive, Instagram)
                </label>
                <input
                  id="content-media-url"
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="content-file"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Or Attach File (Max 50MB)
                </label>
                <input
                  id="content-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-foreground-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-background-100 dark:file:bg-background-800 file:text-foreground-700 dark:file:text-background-200 hover:file:bg-background-200 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Creator Information & Payout */}
          <div className="pt-4 border-t border-background-100 dark:border-background-800 space-y-4">
            <h3 className="text-sm font-semibold text-foreground-800 dark:text-background-200">
              Creator Information & Payout
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="author-name"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Your Name *
                </label>
                <input
                  id="author-name"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Elena Rostova"
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="author-email"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Your Email *
                </label>
                <input
                  id="author-email"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="elena@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="payout-method"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Payout Method
                </label>
                <select
                  id="payout-method"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as "iban" | "wise" | "crypto" | "credits")}
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="iban">Bank Transfer (IBAN - TR / EU)</option>
                  <option value="wise">Wise Email</option>
                  <option value="crypto">USDT (TRC20 / ERC20)</option>
                  <option value="credits">Platform Travel Credits (+15% bonus)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="payout-handle"
                  className="block text-sm font-medium text-foreground-700 dark:text-background-200 mb-1"
                >
                  Payout Handle / Account Details
                </label>
                <input
                  id="payout-handle"
                  type="text"
                  value={payoutHandle}
                  onChange={(e) => setPayoutHandle(e.target.value)}
                  placeholder="TR... or email or USDT wallet"
                  className="w-full px-4 py-2.5 rounded-xl border border-background-200 dark:border-background-700 bg-white dark:bg-background-800 text-foreground-900 dark:text-background-50 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-background-300 text-primary-600 focus:ring-primary-500"
                aria-label="I agree to terms and conditions"
              />
              <span className="text-xs text-foreground-600 dark:text-background-300 leading-relaxed">
                I confirm I am the original creator of this content, grant Alanya Holidays non-exclusive publishing rights, and agree to the Creator UGC Terms & Conditions.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-background-100 dark:border-background-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-foreground-600 dark:text-background-300 hover:text-foreground-900 dark:hover:text-background-50 rounded-xl hover:bg-background-100 dark:hover:bg-background-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 active:scale-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin"></i>
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Review
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
