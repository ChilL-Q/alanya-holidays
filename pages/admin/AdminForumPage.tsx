import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, Plus, Trash2, Flag, Check, EyeOff, GripVertical } from 'lucide-react';
import { db } from '../../api-services';
import { ForumCategory, ForumReport } from '../../types/models';

export const AdminForumPage: React.FC = () => {
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [reports, setReports] = useState<ForumReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cats, reps] = await Promise.all([
                db.getForumCategories(),
                db.getForumReports(false),
            ]);
            setCategories(cats);
            setReports(reps);
        } catch (e) {
            toast.error((e as Error).message || 'Failed to load forum data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await db.createForumCategory({
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                sort_order: categories.length,
            });
            toast.success('Category added');
            setNewName('');
            setNewDescription('');
            fetchAll();
        } catch (e) {
            toast.error((e as Error).message || 'Failed to add category');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Delete this category? Posts in it will become uncategorized.')) return;
        try {
            await db.deleteForumCategory(id);
            toast.success('Category deleted');
            setCategories((prev) => prev.filter((c) => c.id !== id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to delete category');
        }
    };

    const handleResolve = async (report: ForumReport) => {
        try {
            await db.resolveForumReport(report.id);
            toast.success('Report resolved');
            setReports((prev) => prev.filter((r) => r.id !== report.id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to resolve');
        }
    };

    const handleRemoveContent = async (report: ForumReport) => {
        if (!window.confirm(`Hide this ${report.target_type} from public view?`)) return;
        try {
            await db.setRemoved(report.target_type, report.target_id, true);
            await db.resolveForumReport(report.id);
            toast.success('Content hidden and report resolved');
            setReports((prev) => prev.filter((r) => r.id !== report.id));
        } catch (e) {
            toast.error((e as Error).message || 'Failed to remove content');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 size={32} className="animate-spin text-teal-500" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Forum</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Manage categories and moderate reported content.</p>
            </div>

            {/* Categories */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Categories</h2>

                <form onSubmit={handleCreateCategory} className="bg-white dark:bg-slate-800 rounded-xl shadow p-5 max-w-2xl mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                            placeholder="Category name"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                            type="text"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Add Category
                    </button>
                </form>

                {categories.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No categories yet.</p>
                ) : (
                    <div className="space-y-2 max-w-2xl">
                        {categories.map((c) => (
                            <div key={c.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                                <GripVertical size={16} className="text-slate-300" />
                                <div className="flex-grow">
                                    <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                                    {c.description && <p className="text-xs text-slate-500 dark:text-slate-400">{c.description}</p>}
                                </div>
                                <span className="text-xs text-slate-400">/{c.slug}</span>
                                <button
                                    onClick={() => handleDeleteCategory(c.id)}
                                    title="Delete category"
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Reports */}
            <section>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Flag size={18} className="text-amber-500" />
                    Reported Content
                    {reports.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            {reports.length}
                        </span>
                    )}
                </h2>

                {reports.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">No open reports. 🎉</p>
                ) : (
                    <div className="space-y-3 max-w-3xl">
                        {reports.map((r) => (
                            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-medium capitalize">{r.target_type}</span>
                                    <span>Reported by {r.reporter?.full_name || r.reporter?.email || 'a user'}</span>
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">"{r.reason}"</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleRemoveContent(r)}
                                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        <EyeOff size={15} /> Hide content
                                    </button>
                                    <button
                                        onClick={() => handleResolve(r)}
                                        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 font-medium"
                                    >
                                        <Check size={15} /> Dismiss
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-4 text-xs text-slate-400">
                    Tip: open the <Link to="/forum" className="text-teal-600">forum</Link> to view content in context.
                </p>
            </section>
        </div>
    );
};
