import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { HelpCircle, Send } from 'lucide-react';
import { forumService } from '../../../api-services';
import { ForumCategory } from '../../../types/models';
import { SEOHead } from '../../../components/seo/SEOHead';

export const ForumAskPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [body, setBody] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        forumService.getForumCategoryTree()
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
            const post = await forumService.createQuestionPost({
                title: title.trim(),
                body: body.trim(),
                category_id: categoryId || undefined,
            });
            toast.success('Question posted');
            navigate(`/forum/${post.slug}`);
        } catch (e) {
            const err = e as Error;
            toast.error(err.message || 'Failed to post question');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <SEOHead title="Ask Alanya" noIndex />
            <div className="flex items-center gap-3 mb-6">
                <HelpCircle size={28} className="text-teal-600 dark:text-teal-400" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ask Alanya</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Question *</label>
                    <input
                        name="forum-question"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={200}
                        placeholder="What would you like to ask?"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                {categories.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                            name="question-category"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Details *</label>
                    <textarea
                        name="question-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        required
                        rows={8}
                        placeholder="Provide context and details about your question…"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/forum')}
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !title.trim() || !body.trim()}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Send size={16} />}
                        Post Question
                    </button>
                </div>
            </form>
        </div>
    );
};
