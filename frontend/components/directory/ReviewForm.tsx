import React, { useState, useEffect, useCallback } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listingReviewsService } from '../../api-services';
import { ListingReview } from '../../types/models';
import { toast } from 'react-hot-toast';

interface ReviewFormProps {
    listingId: string;
    onSubmit: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ listingId, onSubmit }) => {
    const { isAuthenticated } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [existingReview, setExistingReview] = useState<ListingReview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchExistingReview = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }
        try {
            const review = await listingReviewsService.getUserReviewForListing(listingId);
            setExistingReview(review);
        } catch (error) {
            console.error('Failed to fetch user review:', error);
        } finally {
            setIsLoading(false);
        }
    }, [listingId, isAuthenticated]);

    useEffect(() => {
        fetchExistingReview();
    }, [fetchExistingReview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Please log in to submit a review');
            return;
        }

        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }

        if (comment.trim().length < 10) {
            toast.error('Comment must be at least 10 characters long');
            return;
        }

        setIsSubmitting(true);
        try {
            await listingReviewsService.submitListingReview(listingId, rating, comment.trim());
            setIsSubmitted(true);
            onSubmit();
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit review');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-4 text-center text-slate-500 dark:text-slate-400">
                <Loader2 size={20} className="animate-spin mx-auto" />
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl text-center">
                <Star size={24} className="text-green-500 mx-auto mb-2 fill-green-500" />
                <p className="font-semibold text-green-800 dark:text-green-300">
                    Review submitted and pending approval
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Thank you! Your review will be visible once approved by our team.
                </p>
            </div>
        );
    }

    if (existingReview) {
        const statusBadgeColors: Record<string, string> = {
            pending: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30',
            approved: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30',
            rejected: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30',
        };

        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900 dark:text-white">Your Review</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadgeColors[existingReview.status] || statusBadgeColors.pending}`}>
                        {existingReview.status.charAt(0).toUpperCase() + existingReview.status.slice(1)}
                    </span>
                </div>
                <div className="flex text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={16}
                            className={star <= existingReview.rating ? 'fill-amber-500' : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'}
                        />
                    ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{existingReview.comment}</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Log in to share your experience with this listing.
                </p>
                <a
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                    Log In
                </a>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset className="border-0 p-0 m-0">
                <legend className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Rating
                </legend>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded transition-transform hover:scale-110"
                            aria-label={`Rate ${star} stars`}
                        >
                            <Star
                                size={28}
                                className={
                                    star <= (hoverRating || rating)
                                        ? 'fill-amber-500 text-amber-500'
                                        : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
                                }
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                        {rating > 0 ? `${rating} out of 5` : 'Select a rating'}
                    </span>
                </div>
            </fieldset>

            <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Review
                </label>
                <textarea
                    id="review-comment"
                    name="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this listing... (minimum 10 characters)"
                    rows={4}
                    minLength={10}
                    required
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-all"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                    </>
                ) : (
                    'Submit Review'
                )}
            </button>
        </form>
    );
};
