import React, { useState, useEffect } from 'react';
import { listingReviewsService } from '../../api-services/api/listingReviews';
import { ListingReview } from '../../types/models';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { Star, CheckCircle, XCircle, Trash2, User, MessageSquare } from 'lucide-react';

type ReviewWithRelations = ListingReview & {
    listing?: { id: string; name: string };
};

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export const AdminListingReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ReviewStatus>('pending');
    const [searchQuery, setSearchQuery] = useState('');

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        itemId: string | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        itemId: null,
        title: '',
        message: ''
    });

    const loadReviews = React.useCallback(async () => {
        setLoading(true);
        try {
            const response = await listingReviewsService.getReviewsByStatus(activeTab);
            setReviews(response.data || []);
        } catch (e) {
            console.error('Failed to load listing reviews', e);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleApprove = async (reviewId: string) => {
        try {
            await listingReviewsService.approveReview(reviewId);
            toast.success('Review approved');
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to approve review');
        }
    };

    const handleReject = async (reviewId: string) => {
        try {
            await listingReviewsService.rejectReview(reviewId);
            toast.success('Review rejected');
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to reject review');
        }
    };

    const openDeleteModal = (reviewId: string, authorName: string) => {
        setModalConfig({
            isOpen: true,
            itemId: reviewId,
            title: 'Delete Review',
            message: `Are you sure you want to delete the review by "${authorName}"? This cannot be undone.`
        });
    };

    const handleConfirmDelete = async () => {
        if (!modalConfig.itemId) return;
        try {
            await listingReviewsService.deleteReview(modalConfig.itemId);
            setReviews(prev => prev.filter(r => r.id !== modalConfig.itemId));
            toast.success('Review deleted');
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete review');
        } finally {
            setModalConfig({ isOpen: false, itemId: null, title: '', message: '' });
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const authorName = r.user?.full_name || '';
        const listingName = r.listing?.name || '';
        const comment = r.comment || '';
        return (
            authorName.toLowerCase().includes(q) ||
            listingName.toLowerCase().includes(q) ||
            comment.toLowerCase().includes(q)
        );
    });

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const tabs: { label: string; value: ReviewStatus; count?: number }[] = [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare className="text-teal-500" size={24} />
                        Listing Reviews
                    </h1>
                    <p className="text-slate-500 mt-1">Moderate directory listing reviews</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800/50 shadow-sm w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.value
                                ? 'bg-teal-50 dark:bg-slate-700 text-teal-700 dark:text-cyan-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
                <div className="text-sm text-slate-500">
                    {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
                </div>

                <div className="relative w-full md:w-64">
                    <input
                        id="admin-listing-reviews-search"
                        name="admin-listing-reviews-search"
                        type="text"
                        autoComplete="off"
                        aria-label="Search listing reviews"
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
                    <div className="text-slate-500">Loading reviews...</div>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm p-12 text-center">
                    <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No {activeTab} reviews</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        {activeTab === 'pending'
                            ? 'All caught up! New reviews will appear here.'
                            : `No ${activeTab} reviews to display.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/50">
                        <div className="col-span-2">Author</div>
                        <div className="col-span-2">Listing</div>
                        <div className="col-span-4">Review</div>
                        <div className="col-span-1 text-center">Rating</div>
                        <div className="col-span-1 text-center">Date</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    {filteredReviews.map(review => (
                        <div
                            key={review.id}
                            className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-50 dark:border-slate-800/30 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
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
                                {review.listing?.name || 'Unknown listing'}
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
                            <div className="col-span-2 flex justify-end gap-1">
                                {activeTab !== 'approved' && (
                                    <button
                                        onClick={() => handleApprove(review.id!)}
                                        className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg transition"
                                        title="Approve review"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                {activeTab !== 'rejected' && (
                                    <button
                                        onClick={() => handleReject(review.id!)}
                                        className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition"
                                        title="Reject review"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                )}
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
                onConfirm={handleConfirmDelete}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmLabel="Delete"
                isDestructive={true}
            />
        </div>
    );
};
