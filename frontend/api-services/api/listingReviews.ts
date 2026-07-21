import { supabase } from '../supabase';
import { ListingReview } from '../../types/models';

// Helper to get auth token
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const listingReviewsService = {
    async getListingReviews(listingId: string, page = 1, limit = 20) {
        const res = await fetch(`/api/reviews/listing/${listingId}?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json() as Promise<{ data: ListingReview[], total: number }>;
    },

    async submitListingReview(listingId: string, rating: number, comment: string): Promise<ListingReview> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/listing/${listingId}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comment })
        });
        if (!res.ok) throw new Error('Failed to submit review');
        return res.json();
    },

    async getUserReviewForListing(listingId: string): Promise<ListingReview | null> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return null; // Unauthenticated
        
        const res = await fetch(`/api/reviews/user/listing/${listingId}`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        return Object.keys(data).length === 0 ? null : data; // return null if empty
    },

    // Admin methods
    async getPendingReviews(page = 1, limit = 50) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/admin/pending?page=${page}&limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch pending reviews');
        return res.json() as Promise<{ data: ListingReview[], total: number }>;
    },

    async getReviewsByStatus(status: 'pending' | 'approved' | 'rejected', page = 1, limit = 50) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/admin/status/${status}?page=${page}&limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch reviews by status');
        return res.json() as Promise<{ data: ListingReview[], total: number }>;
    },

    async approveReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${id}/approve`, { method: 'PATCH', headers });
        if (!res.ok) throw new Error('Failed to approve review');
    },

    async rejectReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${id}/reject`, { method: 'PATCH', headers });
        if (!res.ok) throw new Error('Failed to reject review');
    },

    async deleteReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete review');
    },
};
