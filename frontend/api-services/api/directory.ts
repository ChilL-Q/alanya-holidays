import { supabase } from '../supabase';
import { DirectoryListingDB, DirectoryListingCreateInput, ListingAnalyticsSummary, CategoryAnalyticsAverage, ListingClaimDB, ListingAddon } from '../../types/models';
import { fetchJson } from './fetchHelper';

export const TIER_LIMITS: Record<string, number> = { explorer: 5, voyager: 50, signature: 100, partner: 100 };

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const directoryService = {
    async getDirectoryListings(
        page: number = 1,
        limit: number = 20,
        category?: string,
        sortBy: 'created_at' | 'base_score' = 'base_score'
    ): Promise<{ data: DirectoryListingDB[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const query = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sortBy });
        if (category) query.set('category', category);
        return fetchJson(`/api/directory?${query.toString()}`);
    },

    async getRestaurantsListings(page: number = 1, limit: number = 20) {
        return fetchJson(`/api/directory/restaurants?page=${page}&limit=${limit}`);
    },

    async getDirectoryListing(id: string): Promise<DirectoryListingDB | null> {
        try {
            return await fetchJson<DirectoryListingDB>(`/api/directory/${id}`);
        } catch (err) {
            if (err instanceof Error && err.message.includes('404')) return null;
            throw err;
        }
    },

    async getDirectoryListingBySlug(slug: string): Promise<DirectoryListingDB | null> {
        try {
            return await fetchJson<DirectoryListingDB>(`/api/directory/slug/${slug}`);
        } catch (err) {
            if (err instanceof Error && err.message.includes('404')) return null;
            throw err;
        }
    },

    async getDirectoryListingsByCategory(categoryId: string): Promise<DirectoryListingDB[]> {
        return fetchJson<DirectoryListingDB[]>(`/api/directory/category/${categoryId}`);
    },

    async searchDirectoryListings(
        query: string,
        categoryId?: string,
        location?: string,
        page = 1,
        limit = 40,
    ): Promise<{ data: DirectoryListingDB[]; total: number }> {
        const params = new URLSearchParams({ query, page: page.toString(), limit: limit.toString() });
        if (categoryId) params.set('category', categoryId);
        if (location) params.set('location', location);
        
        return fetchJson(`/api/directory/search?${params.toString()}`);
    },

    // ============================================================
    // Landing Page Listings
    // ============================================================

    async getFreeListings(): Promise<DirectoryListingDB[]> {
        return fetchJson<DirectoryListingDB[]>('/api/directory/landing/free').catch(() => []);
    },

    async getPremiumListings(): Promise<DirectoryListingDB[]> {
        return fetchJson<DirectoryListingDB[]>('/api/directory/landing/premium').catch(() => []);
    },

    async getSignatureListings(): Promise<DirectoryListingDB[]> {
        return fetchJson<DirectoryListingDB[]>('/api/directory/landing/signature').catch(() => []);
    },

    async getRecentlyClaimedListings(limit: number = 6): Promise<DirectoryListingDB[]> {
        return fetchJson<DirectoryListingDB[]>(`/api/directory/landing/recent?limit=${limit}`).catch(() => []);
    },

    async voteForListing(listingId: string, vote: 1 | -1): Promise<{ netVotes: number; userVote: number }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${listingId}/vote`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ vote })
        });
        if (!res.ok) throw new Error('Failed to vote for listing');
        return res.json() as Promise<{ netVotes: number; userVote: number }>;
    },

    async getUserVotesBatch(listingIds: string[]): Promise<Record<string, 1 | -1>> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/votes/batch`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingIds })
        });
        if (!res.ok) return {};
        return res.json() as Promise<Record<string, 1 | -1>>;
    },

    async removeListingVote(listingId: string): Promise<{ netVotes: number }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${listingId}/vote`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to remove vote');
        return res.json() as Promise<{ netVotes: number }>;
    },

    async createDirectoryListing(
        listing: DirectoryListingCreateInput,
        locationIds?: string[]
    ): Promise<DirectoryListingDB> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/directory', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ listing, locationIds: locationIds || [] })
        });
        if (!res.ok) throw new Error('Failed to create directory listing');
        return res.json() as Promise<DirectoryListingDB>;
    },

    async sendListingPaymentInstructions(businessName: string, tier: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/directory/payment/instructions', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessName, tier })
        });
        if (!res.ok) console.error('Failed to send listing payment email');
    },

    async updateDirectoryListing(
        id: string,
        updates: Partial<DirectoryListingDB>,
        locationIds?: string[]
    ): Promise<DirectoryListingDB> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates, locationIds: locationIds || [] })
        });
        if (!res.ok) throw new Error('Failed to update directory listing');
        return res.json() as Promise<DirectoryListingDB>;
    },

    async deleteDirectoryListing(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to delete directory listing');
    },

    async getDirectoryListingsByStatus(
        status: 'approved' | 'rejected',
        category?: string
    ): Promise<DirectoryListingDB[]> {
        const headers = await getAuthHeaders();
        const query = category ? `?category=${category}` : '';
        const res = await fetch(`/api/directory/admin/status/${status}${query}`, { headers });
        if (!res.ok) throw new Error(`Error fetching ${status} listings`);
        return res.json() as Promise<DirectoryListingDB[]>;
    },

    async getPendingDirectoryListings(): Promise<DirectoryListingDB[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/admin/pending`, { headers });
        if (!res.ok) throw new Error('Error fetching pending listings');
        return res.json() as Promise<DirectoryListingDB[]>;
    },

    async approveDirectoryListing(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${id}/approve`, {
            method: 'POST',
            headers
        });
        if (!res.ok) throw new Error('Error approving listing');
    },

    async rejectDirectoryListing(id: string, reason: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${id}/reject`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error('Error rejecting listing');
    },

    async trackListingView(listingId: string): Promise<void> {
        const res = await fetch(`/api/directory/${listingId}/track/view`, { method: 'POST' });
        if (!res.ok) console.error('Error tracking view');
    },

    async trackListingClick(listingId: string, clickType: 'whatsapp' | 'website' | 'map'): Promise<void> {
        const res = await fetch(`/api/directory/${listingId}/track/click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clickType })
        });
        if (!res.ok) console.error('Error tracking click');
    },

    async getDirectoryAnalyticsForOwner(days: number = 30): Promise<ListingAnalyticsSummary[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/analytics/owner?days=${days}`, { headers });
        if (!res.ok) throw new Error('Error getting analytics');
        return res.json() as Promise<ListingAnalyticsSummary[]>;
    },

    async getMyDirectoryListings(): Promise<DirectoryListingDB[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/me/listings`, { headers });
        if (!res.ok) throw new Error('Error getting my listings');
        return res.json() as Promise<DirectoryListingDB[]>;
    },

    async getListingAddons(listingId: string): Promise<ListingAddon[]> {
        const res = await fetch(`/api/directory/${listingId}/addons`);
        if (!res.ok) throw new Error('Error getting addons');
        return res.json() as Promise<ListingAddon[]>;
    },

    async createAddonCheckout(
        listingId: string,
        addonType: 'verified_badge' | 'seasonal_placement' | 'sponsored_article' | 'ai_localization'
    ): Promise<{ url: string }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/${listingId}/addons/checkout`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ addonType })
        });
        if (!res.ok) throw new Error('Error creating addon checkout');
        return res.json() as Promise<{ url: string }>;
    },

    async getCategoryAnalyticsAverage(
        categoryId: string,
        days: number = 30
    ): Promise<CategoryAnalyticsAverage | null> {
        const res = await fetch(`/api/directory/analytics/category/${categoryId}?days=${days}`);
        if (!res.ok) throw new Error('Error getting category analytics');
        return res.json() as Promise<CategoryAnalyticsAverage | null>;
    },

    async submitListingClaim(
        claim: Omit<ListingClaimDB, 'id' | 'created_at' | 'updated_at' | 'status' | 'user_id' | 'email_verified' | 'verification_token' | 'verification_expires_at' | 'rejection_reason'>
    ): Promise<ListingClaimDB> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/claims`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(claim)
        });
        if (!res.ok) throw new Error('Error submitting claim');
        return res.json() as Promise<ListingClaimDB>;
    },

    async verifyClaimEmail(token: string): Promise<ListingClaimDB | null> {
        const res = await fetch(`/api/directory/claims/verify?token=${token}`);
        if (!res.ok) return null;
        return res.json() as Promise<ListingClaimDB>;
    },

    async getListingClaims(): Promise<ListingClaimDB[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/claims`, { headers });
        if (!res.ok) throw new Error('Error getting claims');
        return res.json() as Promise<ListingClaimDB[]>;
    },

    async approveListingClaim(claimId: string): Promise<boolean> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/claims/${claimId}/approve`, {
            method: 'POST',
            headers
        });
        if (!res.ok) throw new Error('Error approving claim');
        return true;
    },

    async rejectListingClaim(claimId: string, reason: string): Promise<boolean> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/directory/claims/${claimId}/reject`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error('Error rejecting claim');
        return true;
    }
};