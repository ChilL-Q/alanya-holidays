import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { toast } from 'react-hot-toast';
import { PlatformTestimonial } from '../../api-services/api/testimonials';
import { Loader2, Plus, Trash2, Eye, EyeOff, Star } from 'lucide-react';

export const AdminTestimonialsPage: React.FC = () => {
    const [testimonials, setTestimonials] = useState<PlatformTestimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [isVisible, setIsVisible] = useState(true);

    const fetchTestimonials = async () => {
        setIsLoading(true);
        try {
            const data = await db.getAllTestimonials();
            setTestimonials(data);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to load testimonials');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            await db.createTestimonial({
                name: name.trim(),
                role: role.trim() || undefined,
                content: content.trim(),
                rating,
                is_visible: isVisible,
            });
            toast.success('Testimonial added');
            // Reset form
            setName('');
            setRole('');
            setContent('');
            setRating(5);
            setIsVisible(true);
            fetchTestimonials();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to add testimonial');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
        try {
            await db.toggleVisibility(id, !currentVisible);
            toast.success(`Testimonial ${!currentVisible ? 'visible' : 'hidden'}`);
            fetchTestimonials();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to toggle visibility');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this testimonial?')) return;
        try {
            await db.deleteTestimonial(id);
            toast.success('Testimonial deleted');
            fetchTestimonials();
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete testimonial');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Testimonials</h1>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Manage testimonials that appear on the homepage.
                </p>
            </div>

            {/* Add Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 max-w-3xl">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Testimonial</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="testimonial-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Name *
                        </label>
                        <input
                            id="testimonial-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. John Doe"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="testimonial-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Role / Location
                        </label>
                        <input
                            id="testimonial-role"
                            type="text"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="e.g. Guest from UK"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="testimonial-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Content *
                    </label>
                    <textarea
                        id="testimonial-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={3}
                        placeholder="Write the testimonial text here..."
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                </div>

                <div className="flex items-center gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Rating
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 focus:outline-none"
                                >
                                    <Star
                                        size={20}
                                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-6">
                        <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => setIsVisible(e.target.checked)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Visible on Homepage
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Add Testimonial
                </button>
            </form>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 size={32} className="animate-spin text-teal-500" />
                </div>
            ) : testimonials.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No testimonials found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col relative overflow-hidden group">
                            {!t.is_visible && (
                                <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                    HIDDEN
                                </div>
                            )}
                            <div className="flex gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                                ))}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 italic flex-grow">
                                "{t.content}"
                            </p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</p>
                                    {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleVisibility(t.id, t.is_visible)}
                                        title={t.is_visible ? "Hide" : "Show"}
                                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {t.is_visible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        title="Delete"
                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
