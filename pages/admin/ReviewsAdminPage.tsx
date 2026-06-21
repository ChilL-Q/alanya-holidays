import React, { useState, useEffect } from 'react';
import { db } from '../../api-services';
import { Review } from '../../types/models';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { Star, Flag, Trash2, CheckCircle, User } from 'lucide-react';

export const ReviewsAdminPage: React.FC = () => {
    const [reviews, setReviews] = useState<(Review & { user?: { full_name: string; avatar_url: string }; properties?: { title: string } })[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'delete' | 'bulkDelete' | null;
        itemId: string | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: null,
        itemId: null,
        title: '',
        message: ''
    });

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const response = await db.getFlaggedReviews(1, 100);
            setReviews(response.data || []);
        } catch (e) {
            console.error('Failed to load flagged reviews', e);
            toast.error('Failed to load flagged reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleUnflag = async (reviewId: string) => {
        try {
            await db.unflagReview(reviewId);
            toast.success('Review unflagged and restored');
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(reviewId);
                return next;
            });
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to unflag review');
        }
    };

    const openDeleteModal = (reviewId: string, authorName: string) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            itemId: reviewId,
            title: 'Delete Review',
            message: `Are you sure you want to delete the review by "${authorName}"? This cannot be undone.`
        });
    };

    const openBulkDeleteModal = () => {
        if (selectedIds.size === 0) return;
        setModalConfig({
            isOpen: true,
            type: 'bulkDelete',
            itemId: null,
            title: 'Delete Selected Reviews',
            message: `Are you sure you want to delete ${selectedIds.size} selected review(s)? This cannot be undone.`
        });
    };

    const handleConfirmAction = async () => {
        try {
            if (modalConfig.type === 'delete' && modalConfig.itemId) {
                await db.deleteReview(modalConfig.itemId);
                setReviews(prev => prev.filter(r => r.id !== modalConfig.itemId));
            } else if (modalConfig.type === 'bulkDelete' && selectedIds.size > 0) {
                await db.bulkDeleteReviews(Array.from(selectedIds));
                setReviews(prev => prev.filter(r => !selectedIds.has(r.id)));
                setSelectedIds(new Set());
            }
            toast.success('Reviews deleted successfully');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete reviews');
        } finally {
            setModalConfig({ isOpen: false, type: null, itemId: null, title: '', message: '' });
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === reviews.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(reviews.map(r => r.id)));
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const authorName = r.user?.full_name || '';
        const propertyName = r.properties?.title || '';
        const comment = r.comment || '';
        return authorName.toLowerCase().includes(q) || propertyName.toLowerCase().includes(q) || comment.toLowerCase().includes(q);
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Flag className="text-orange-500" size={24} />
                        Flagged Reviews
                    </h1>
                    <p className="text-slate-500 mt-1">Review and moderate flagged content</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <>
                            <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
                            <button
                                onClick={openBulkDeleteModal}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Selected
                            </button>
                        </>
                    )}
                </div>

                <div className="relative w-full md:w-64">
                    <input
                        id="admin-reviews-search"
                        name="admin-reviews-search"
                        type="text"
                        autoComplete="off"
                        aria-label="Search flagged reviews"
                        placeholder="Search reviews..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/50 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none transition-all dark:text-white text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-12 text-center">
                    <div className="text-slate-500">Loading flagged reviews...</div>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-12 text-center">
                    <Flag size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No flagged reviews</h3>
                    <p className="text-slate-500 text-sm mt-1">All reviews look clean. Flagged reviews will appear here.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/50">
                        <div className="col-span-1 flex items-center">
                            <input
                                type="checkbox"
                                checked={selectedIds.size === reviews.length && reviews.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                        </div>
                        <div className="col-span-2">Author</div>
                        <div className="col-span-2">Property</div>
                        <div className="col-span-4">Review</div>
                        <div className="col-span-1 text-center">Rating</div>
                        <div className="col-span-1 text-center">Date</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    {filteredReviews.map(review => (
                        <div
                            key={review.id}
                            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 dark:border-slate-800/30 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${selectedIds.has(review.id) ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}`}
                        >
                            <div className="col-span-1 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(review.id)}
                                    onChange={() => toggleSelect(review.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                />
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                                    {review.user?.avatar_url ? (
                                        <img src={review.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <User size={14} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                    {review.user?.full_name || 'Anonymous'}
                                </span>
                            </div>
                            <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400 truncate">
                                {review.properties?.title || 'Unknown property'}
                            </div>
                            <div className="col-span-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                                {review.comment}
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={12}
                                            className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-1 text-center text-xs text-slate-400">
                                {formatDate(review.created_at)}
                            </div>
                            <div className="col-span-1 flex justify-end gap-1">
                                <button
                                    onClick={() => handleUnflag(review.id!)}
                                    className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg transition"
                                    title="Unflag & restore"
                                >
                                    <CheckCircle size={16} />
                                </button>
                                <button
                                    onClick={() => openDeleteModal(review.id!, review.user?.full_name || 'Anonymous')}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                                    title="Delete review"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmLabel="Delete"
                isDestructive={true}
            />
        </div>
    );
};
