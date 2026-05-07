import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api-services';
import { toast } from 'react-hot-toast';
import { PenLine, X, ImagePlus, Video, ArrowLeft, Send } from 'lucide-react';

const MAX_IMAGES = 5;

export const AdminAddBlogPostPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_IMAGES - mediaFiles.length;
        const toAdd = files.slice(0, remaining);

        const valid: File[] = [];
        for (const file of toAdd) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 5MB limit`);
                continue;
            }
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
                toast.error(`${file.name} is not a supported format`);
                continue;
            }
            valid.push(file);
        }

        if (!valid.length) return;

        setMediaFiles(prev => [...prev, ...valid]);
        valid.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setMediaPreviews(prev => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

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
                setUploading(true);
                const toastId = toast.loading('Uploading images...');
                try {
                    uploadedUrls = await db.uploadBlogMediaBatch(mediaFiles);
                    toast.success('Images uploaded', { id: toastId });
                } catch (err: any) {
                    toast.error(err.message || 'Failed to upload images', { id: toastId });
                    return;
                } finally {
                    setUploading(false);
                }
            }

            const toastId = toast.loading('Publishing blog post...');
            await db.createBlogPost({
                title: title.trim(),
                content: content.trim(),
                video_url: videoUrl.trim() || undefined,
                cover_image_url: uploadedUrls[0] || undefined,
                status: 'published',
                is_featured: isFeatured,
            });

            toast.success('Blog post published successfully!', { id: toastId });
            navigate('/admin/blog-submissions');
        } catch (err: any) {
            toast.error(err.message || 'Failed to publish post');
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
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="Write the full content here..."
                        rows={14}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-y"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Cover Images (First is main cover)
                    </label>
                    <p className="text-xs text-slate-400 mb-4">Max {MAX_IMAGES} images. JPG/PNG/WebP, up to 5MB.</p>

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
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded-md">
                                            Cover
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(i)}
                                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {mediaFiles.length < MAX_IMAGES && (
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
