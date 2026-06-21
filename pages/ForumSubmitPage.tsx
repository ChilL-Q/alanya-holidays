import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Send } from 'lucide-react';
import { db } from '../api-services';
import { ForumCategory } from '../types/models';
import { SEOHead } from '../components/seo/SEOHead';

export const ForumSubmitPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        db.getForumCategoryTree()
            .then((tree) => {
                setCategories(tree);
                const firstChild = tree.find((c) => (c.children?.length ?? 0) > 0)?.children?.[0];
                if (firstChild) setCategoryId(firstChild.id);
            })
            .catch((e) => console.error('Failed to load categories:', e));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;

        setIsSubmitting(true);
        try {
            const post = await db.createForumPost({
                title: title.trim(),
                body: body.trim(),
                category_id: categoryId || undefined,
            });
            toast.success('Post published');
            navigate(`/forum/${post.slug}`);
        } catch (e) {
            const err = e as Error;
            toast.error(err.message || 'Failed to publish post');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <SEOHead title="New Forum Post" noIndex />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create a Post</h1>

            <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                    <input
                        name="forum-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="What do you want to discuss?"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {categories.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                            name="filter-category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        >
                            {categories.map((parent) => (
                                <optgroup key={parent.id} label={parent.name}>
                                    {(parent.children ?? []).map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Body *</label>
                    <textarea
                        name="forum-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={8}
                        placeholder="Share the details…"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/forum')}
                        className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Publish
                    </button>
                </div>
            </form>
        </div>
    );
};
