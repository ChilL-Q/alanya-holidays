import { supabase } from '../../supabase';
import { Review } from '../../../types/index';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getReviews(propertyId: string, page: number = 1, limit: number = 10) {
    const res = await fetch(`/api/properties/${propertyId}/reviews?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
}

export async function getReviewCount(propertyId: string) {
    const res = await fetch(`/api/properties/${propertyId}/reviews/count`);
    if (!res.ok) throw new Error('Failed to fetch review count');
    return res.json() as Promise<number>;
}

export async function addReview(review: Omit<Review, 'id' | 'created_at' | 'user_id'>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${review.property_id}/reviews`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to add review' }));
        throw new Error(error.message || 'Failed to add review');
    }
}

export async function deleteReview(reviewId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/reviews/${reviewId}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to delete review');
}

export async function flagReview(reviewId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers
    });
    if (!res.ok) throw new Error('Failed to flag review');
}

export async function unflagReview(reviewId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/reviews/${reviewId}/unflag`, {
        method: 'POST',
        headers
    });
    if (!res.ok) throw new Error('Failed to unflag review');
}

export async function getFlaggedReviews(page: number = 1, limit: number = 20) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/reviews/admin/flagged?page=${page}&limit=${limit}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch flagged reviews');
    return res.json();
}

export async function bulkDeleteReviews(reviewIds: string[]) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/properties/reviews/admin/bulk-delete', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds })
    });
    if (!res.ok) throw new Error('Failed to bulk delete reviews');
}
