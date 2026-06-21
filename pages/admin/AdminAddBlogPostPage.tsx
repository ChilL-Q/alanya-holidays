import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { toast } from 'react-hot-toast';
import { X, ImagePlus, Video, ArrowLeft, Send } from 'lucide-react';
import { formatBlogContent, MAX_BLOG_IMAGES } from '../../utils/formatBlogContent';
import { useBlogMediaUpload } from '../../hooks/useBlogMediaUpload';

export const AdminAddBlogPostPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
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
    } = useBlogMediaUpload({ content, setContent });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (title.trim().length < 5) {
            toast.error('Title must be at least 5 characters');
            return;
        }
        if (content.trim().length < 50) {
            toast.error('Content must be at least 50 characters');
            return;
        }

        setSubmitting(true);
        let uploadedUrls: string[] = [];

        try {
            if (mediaFiles.length > 0) {
                uploadedUrls = await uploadImages();
            }

            const formattedContent = formatBlogContent(content.trim(), uploadedUrls);

            const toastId = toast.loading('Publishing blog post...');
            await db.createBlogPost({
                title: title.trim(),
                content: formattedContent,
                video_url: videoUrl.trim() || undefined,
                cover_image_url: uploadedUrls[0] || undefined,
                status: 'published',
                is_featured: isFeatured,
            });

            toast.success('Blog post published successfully!', { id: toastId });
            navigate('/admin/blog-submissions');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to publish post');
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitting = submitting || uploading;

    return (
        <div className="space-y-6">
            <Link
                to="/admin/blog-submissions"
                className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Blog Submissions
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Blog Post</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Create a new blog post directly from the admin panel. It will be published immediately.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="blog-title"
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. 10 Hidden Beaches in Alanya"
                        maxLength={200}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Article Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        name="blog-content"
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Write the full content here..."
                        rows={14}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-y"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                        Supports markdown: <code>## Heading</code>, <code>- list item</code>, <code>**bold**</code>, <code>&gt; Don&apos;t Miss: important tip</code>.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cover Images (First is main cover)
                    </label>
                    <p className="text-xs text-slate-400 mb-4">Max {MAX_BLOG_IMAGES} images. JPG/PNG/WebP, up to 5MB.</p>

                    {mediaPreviews.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                            {mediaPreviews.map((src, i) => (
                                <div key={i} className="relative group aspect-square">
                                    <img
                                        src={src}
                                        alt={`Preview ${i + 1}`}
                                        className="w-full h-full object-cover rounded-xl border border-slate-200"
                                    />
                                    {i === 0 && (
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-md z-10">
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
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
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
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors"
                        >
                            <ImagePlus size={16} />
                            Add Images
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

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <Video size={15} /> Video URL <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                        name="video-url"
                        type="url"
                        value={videoUrl}
                        onChange={e => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isFeatured}
                            onChange={(e) => setIsFeatured(e.target.checked)}
                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Feature on Homepage</span>
                            <span className="block text-xs text-slate-500">This post will appear in the "Travel Guide" section on the main page.</span>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                {uploading ? 'Uploading...' : 'Publishing...'}
                            </>
                        ) : (
                            <>
                                <Send size={16} /> Publish Post
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
