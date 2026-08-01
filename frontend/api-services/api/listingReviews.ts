import { supabase } from '../supabase';
import { ListingReview } from '../../types/models';

// Helper to get auth token
async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

// Helper to handle API response errors with backend error messages
async function handleResponse<T>(res: Response, fallbackErrorMsg: string): Promise<T> {
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || fallbackErrorMsg);
    }
    return res.json() as Promise<T>;
}

export const listingReviewsService = {
    async getListingReviews(listingId: string, page = 1, limit = 20) {
        const res = await fetch(`/api/reviews/listing/${encodeURIComponent(listingId)}?page=${page}&limit=${limit}`);
        return handleResponse<{ data: ListingReview[]; total: number }>(res, 'Failed to fetch reviews');
    },

    async submitListingReview(listingId: string, rating: number, comment: string): Promise<ListingReview> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/listing/${encodeURIComponent(listingId)}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating, comment })
        });
        return handleResponse<ListingReview>(res, 'Failed to submit review');
    },

    async getUserReviewForListing(listingId: string): Promise<ListingReview | null> {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return null; // Unauthenticated

        const res = await fetch(`/api/reviews/user/listing/${encodeURIComponent(listingId)}`, { headers });
        
        // 204 No Content or 404 Not Found explicitly mean no review exists
        if (res.status === 204 || res.status === 404) return null;
        
        if (!res.ok) {
            // Throw for server errors (5xx) or unexpected codes so UI can handle it gracefully
            throw new Error(`Failed to fetch user review (HTTP ${res.status})`);
        }

        const text = await res.text();
        if (!text || !text.trim()) return null;

        try {
            const data = JSON.parse(text);
            return (data && typeof data === 'object' && Object.keys(data).length > 0) ? (data as ListingReview) : null;
        } catch {
            return null;
        }
    },

    // Admin methods
    async getPendingReviews(page = 1, limit = 50) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/admin/pending?page=${page}&limit=${limit}`, { headers });
        return handleResponse<{ data: ListingReview[]; total: number }>(res, 'Failed to fetch pending reviews');
    },

    async getReviewsByStatus(status: 'pending' | 'approved' | 'rejected', page = 1, limit = 50) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/admin/status/${encodeURIComponent(status)}?page=${page}&limit=${limit}`, { headers });
        return handleResponse<{ data: ListingReview[]; total: number }>(res, 'Failed to fetch reviews by status');
    },

    async approveReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/approve`, { method: 'PATCH', headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to approve review');
        }
    },

    async rejectReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${encodeURIComponent(id)}/reject`, { method: 'PATCH', headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to reject review');
        }
    },

    async deleteReview(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/reviews/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to delete review');
        }
    },
};

