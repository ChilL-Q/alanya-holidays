import React, { useEffect, useState } from 'react';
import { Star, User, Camera, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { db, Review } from '../../api-services';
import { ReviewModal } from './ReviewModal';
import { useLightbox } from '../../context/LightboxContext';
import { toast } from 'react-hot-toast';

interface ReviewsSectionProps {
    propertyId: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ propertyId }) => {
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();
    const { openLightbox } = useLightbox();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

    const fetchReviews = async () => {
        try {
            const data = await db.getReviews(propertyId);
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [propertyId]);

    const handleWriteReview = () => {
        if (!isAuthenticated) {
            toast.error("Please login to write a review");
            return;
        }
        setIsModalOpen(true);
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!user) return;

        console.log('🗑️ Attempting to delete review:', reviewId, 'by user:', user.id);

        if (!confirm('Are you sure you want to delete this review?')) {
            return;
        }

        setDeletingReviewId(reviewId);
        try {
            console.log('🗑️ Calling deleteReview API...');
            await db.deleteReview(reviewId, user.id);
            console.log('✅ Review deleted successfully');
            toast.success('Review deleted successfully');
            console.log('🔄 Fetching updated reviews...');
            await fetchReviews();
            console.log('✅ Reviews refreshed');
        } catch (error) {
            console.error('❌ Failed to delete review:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete review');
        } finally {
            setDeletingReviewId(null);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <div className="py-8 text-center text-slate-500">Loading reviews...</div>;

    return (
        <section id="reviews-section" className="py-12 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Star className="text-yellow-400 fill-yellow-400" />
                        {reviews.length} Reviews
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Average Rating: {reviews.length > 0
                            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                            : 'New'}
                    </p>
                </div>

                <button
                    onClick={handleWriteReview}
                    className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 transition"
                >
                    Write a Review
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.length > 0 ? (
                    reviews.map((review, idx) => (
                        <div key={review.id || idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        {review.user?.avatar_url ? (
                                            <img src={review.user.avatar_url} alt={review.user.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{review.user?.full_name || 'Anonymous'}</h4>
                                        <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300 dark:text-slate-700"}
                                            />
                                        ))}
                                    </div>
                                    {user && review.user_id === user.id && (
                                        <button
                                            onClick={() => handleDeleteReview(review.id!)}
                                            disabled={deletingReviewId === review.id}
                                            className="ml-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition disabled:opacity-50"
                                            title="Delete review"
                                            aria-label="Delete review"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                {review.comment}
                            </p>

                            {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                    {review.images.map((img, i) => (
                                        <div
                                            key={i}
                                            className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-zoom-in border border-slate-100 dark:border-slate-700"
                                            onClick={() => openLightbox(review.images!, i)}
                                        >
                                            <img src={img} alt="Review" className="w-full h-full object-cover hover:scale-110 transition duration-500" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="mx-auto w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-3">
                            <Star size={24} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">No reviews yet. Be the first to share your experience!</p>
                    </div>
                )}
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                propertyId={propertyId}
                userId={user?.id || ''}
                onSuccess={fetchReviews}
            />
        </section>
    );
};
