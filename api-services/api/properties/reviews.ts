import { supabase } from '../../supabase';
import { Review } from '../../../types/index';
import { reviewSchema } from '../schemas';
import { getAppUrl } from '../../../utils/appUrl';
import { retry } from '../../../utils/retry';

export async function getReviews(propertyId: string, page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from('reviews')
        .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .range(from, to);
    if (error) throw error;
    return {
        data: data as Review[],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };
}

export async function getReviewCount(propertyId: string) {
    const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', propertyId);
    if (error) throw error;
    return count || 0;
}

export async function addReview(review: Omit<Review, 'id' | 'created_at'>) {
    const validatedData = reviewSchema.parse(review);

    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('property_id', validatedData.property_id)
        .eq('user_id', validatedData.user_id)
        .maybeSingle();

    if (existing) throw new Error('You have already submitted a review for this property');

    const { error } = await supabase.from('reviews').insert([validatedData]).select().single();
    if (error) throw error;

    const { data: property } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', review.property_id)
        .single();

    if (property) {
        retry(() => supabase.functions.invoke('send-email', {
            body: {
                type: 'new_review',
                userId: property.host_id,
                data: {
                    itemTitle: property.title,
                    rating:    review.rating,
                    comment:   review.comment,
                    guestName: 'A Guest',
                    link:      getAppUrl(`property/${review.property_id}`)
                }
            }
        })).catch(err => console.error('Failed to send review email:', err));
    }
}

export async function deleteReview(reviewId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: review, error: fetchError } = await supabase
        .from('reviews')
        .select('user_id')
        .eq('id', reviewId)
        .single();

    if (fetchError) throw fetchError;
    if (!review) throw new Error('Review not found');
    if (review.user_id !== user.id) throw new Error('Unauthorized: You can only delete your own reviews');

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
}
