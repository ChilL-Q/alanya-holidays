import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { toast } from 'react-hot-toast';
import { PenLine, X, ImagePlus, Video, ArrowLeft, Send, Info } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { formatBlogContent, MAX_BLOG_IMAGES } from '../utils/formatBlogContent';
import { useBlogMediaUpload } from '../hooks/useBlogMediaUpload';
import { BlogContentEditor } from '../components/blog/BlogContentEditor';

export const BlogSubmitPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const {
        mediaFiles,
        mediaPreviews,
        uploading,
        fileInputRef,
        textareaRef,
        insertPlaceholder,
        handleFileSelect,
        removeMedia,
        uploadImages,
    } = useBlogMediaUpload({ setContent });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (title.trim().length < 5) {
            toast.error('Title must be at least 5 characters');
            return;
        }
        if (content.trim().length < 100) {
            toast.error('Content must be at least 100 characters');
            return;
        }

        setSubmitting(true);
        let uploadedUrls: string[] = [];

        try {
            // Upload images first
            if (mediaFiles.length > 0) {
                uploadedUrls = await uploadImages();
            }

            // Pre-process and format plain text content to HTML with placeholders replaced
            const processedContent = formatBlogContent(content.trim(), uploadedUrls);

            // Create submission
            const toastId = toast.loading('Submitting article...');
            await db.createBlogSubmission({
                title: title.trim(),
                content: processedContent,
                video_url: videoUrl.trim() || undefined,
                media_urls: uploadedUrls,
            });

            toast.success('Article submitted successfully!', { id: toastId });
            navigate('/blog/submission-success');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit article');
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitting = submitting || uploading;

    return (
        <>
        <SEOHead
            title="Submit Blog Post | Alanya Holidays"
            description="Share your Alanya travel experience. Submit your blog post and help other travelers discover Alanya."
            keywords={['alanya blog submit', 'travel blog alanya', 'write about alanya']}
            noIndex
        />
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Back link */}
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-cyan-400 mb-8 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Blog
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-cyan-400 rounded-full text-sm font-semibold mb-4">
                        <PenLine size={14} />
                        Submit an Article
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Share Your Story
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Write about Alanya — tips, guides, hidden gems. If your article is accepted and published, we will send you €5 as a token of appreciation!
                    </p>
                </div>

                {/* Info box */}
                <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl mb-8">
                    <Info size={18} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>How it works:</strong> Fill in the form → our team reviews within 2–3 business days → if approved, we publish your article and pay €5 to your provided payment details.
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Title */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Article Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            name="blog-title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. 10 Hidden Beaches in Alanya You've Never Heard Of"
                            maxLength={200}
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                        <p className="mt-1.5 text-xs text-slate-400">{title.length}/200 characters</p>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Article Content <span className="text-red-500">*</span>
                        </label>
                        <BlogContentEditor
                            content={content}
                            onChange={setContent}
                            textareaRef={textareaRef}
                            placeholder="Write your article here. Share your experience, tips, or insider knowledge about Alanya. Minimum 100 characters. Tip: Upload images and hover over them to insert placeholders where you want them in the text!"
                            rows={14}
                            required
                            minLength={100}
                            textareaClassName="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-y font-sans text-sm leading-relaxed"
                        />
                    </div>

                    {/* Media Upload */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Images <span className="text-slate-400 font-normal">(optional, up to {MAX_BLOG_IMAGES})</span>
                        </label>
                        <p className="text-xs text-slate-400 mb-4">JPG, PNG, WebP — max 5MB each. First image becomes the cover. Hover on an image to insert it into your content!</p>

                        {/* Previews */}
                        {mediaPreviews.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                                {mediaPreviews.map((src, i) => (
                                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={src}
                                            alt={`Preview ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        {i === 0 && (
                                            <span className="absolute bottom-1 left-1 text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-md font-semibold z-10">
                                                Cover
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => insertPlaceholder(i)}
                                            className="absolute inset-0 bg-black/40 text-white font-semibold text-xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer z-10"
                                        >
                                            <ImagePlus size={16} />
                                            <span>Insert to text</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeMedia(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {mediaFiles.length < MAX_BLOG_IMAGES && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
                            >
                                <ImagePlus size={16} />
                                Add Images ({mediaFiles.length}/{MAX_BLOG_IMAGES})
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Video URL */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            <span className="flex items-center gap-2">
                                <Video size={15} />
                                Video URL <span className="text-slate-400 font-normal">(optional)</span>
                            </span>
                        </label>
                        <input
                            name="video-url"
                            type="url"
                            value={videoUrl}
                            onChange={e => setVideoUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Submission is <span className="font-semibold text-slate-700 dark:text-slate-300">free</span> — best articles earn €5
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    {uploading ? 'Uploading...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Submit Article
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
        </>
    );
};
