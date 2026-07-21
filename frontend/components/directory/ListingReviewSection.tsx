import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Loader2, User } from 'lucide-react';
import { listingReviewsService } from '../../api-services';
import { ListingReview } from '../../types/models';
import { ReviewForm } from './ReviewForm';

interface ListingReviewSectionProps {
    listingId: string;
}

export const ListingReviewSection: React.FC<ListingReviewSectionProps> = ({ listingId }) => {
    const [reviews, setReviews] = useState<ListingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await listingReviewsService.getListingReviews(listingId);
            setReviews(response.data);
        } catch (err) {
            console.error('Failed to fetch listing reviews:', err);
            setError('Failed to load reviews. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [listingId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleReviewSubmitted = () => {
        fetchReviews();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={20} className="text-teal-600 dark:text-teal-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reviews</h3>
                {reviews.length > 0 && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                        ({reviews.length})
                    </span>
                )}
            </div>

            <ReviewForm listingId={listingId} onSubmit={handleReviewSubmitted} />

            {loading ? (
                <div className="py-6 text-center text-slate-500 dark:text-slate-400">
                    <Loader2 size={20} className="animate-spin mx-auto" />
                </div>
            ) : error ? (
                <div className="py-4 text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                </div>
            ) : reviews.length === 0 ? (
                <div className="py-6 text-center text-slate-500 dark:text-slate-400">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div
                            key={review.id}
                            className="p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl"
                        >
                            <div className="flex items-start gap-3">
                                {review.user?.avatar_url ? (
                                    <img
                                        src={review.user.avatar_url}
                                        alt={review.user.full_name || 'User'}
                                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                        <User size={18} className="text-slate-400 dark:text-slate-500" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                            {review.user?.full_name || 'Anonymous'}
                                        </p>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                                            {formatDate(review.created_at)}
                                        </span>
                                    </div>
                                    <div className="flex text-amber-500 mt-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={14}
                                                className={
                                                    star <= review.rating
                                                        ? 'fill-amber-500'
                                                        : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {review.comment}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
