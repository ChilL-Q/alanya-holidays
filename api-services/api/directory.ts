import { supabase } from '../supabase';
import { DirectoryListingDB, DirectoryListingCreateInput, ListingAnalyticsSummary, CategoryAnalyticsAverage } from '../../types/models';
import { retry } from '../../utils/retry';
import { sanitizeString } from '../../utils/sanitize';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUIDs(ids: string[]) {
    for (const id of ids) {
        if (!UUID_RE.test(id)) throw new Error(`Invalid UUID: ${id}`);
    }
}

const TIER_LIMITS: Record<string, number> = { explorer: 5, voyager: 50, signature: 100, partner: 100 };

function buildLocationRows(listingId: string, locationIds: string[]) {
    return locationIds.map((lid, i) => ({
        listing_id: listingId,
        location_id: lid,
        display_order: i,
    }));
}

function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
        return sanitizeString(value);
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value !== null && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = sanitizeValue(v);
        }
        return result;
    }
    return value;
}

const sanitize = <T extends Record<string, unknown>>(obj: T): T => {
    return sanitizeValue(obj) as T;
};

const LISTING_LOCATIONS_SELECT = '*, listing_locations(id, location_id, display_order, locations(id, name))';

export const directoryService = {
    async getDirectoryListings(
        page: number = 1,
        limit: number = 20,
        category?: string,
        sortBy: 'created_at' | 'base_score' = 'created_at'
    ): Promise<{ data: DirectoryListingDB[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('directory_listings')
            .select('*', { count: 'exact' })
            .order(sortBy, { ascending: false });

        if (category) {
            query = query.eq('category_id', category);
        }

        const { data, error, count } = await query.range(from, to);

        if (error) {
            console.error('Error fetching directory listings:', error);
            throw error;
        }

        return {
            data: data as DirectoryListingDB[],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        };
    },

    async getRestaurantsListings(page: number = 1, limit: number = 20) {
        return this.getDirectoryListings(page, limit, 'restaurants');
    },

    async getDirectoryListing(id: string): Promise<DirectoryListingDB | null> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching directory listing:', error);
            throw error;
        }

        return data as DirectoryListingDB | null;
    },

    async getDirectoryListingBySlug(slug: string): Promise<DirectoryListingDB | null> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching directory listing by slug:', error);
            throw error;
        }

        return data as DirectoryListingDB | null;
    },

    async getDirectoryListingsByCategory(categoryId: string): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT)
            .eq('category_id', categoryId)
            .order('base_score', { ascending: false })
            .order('is_featured', { ascending: false })
            .order('net_votes', { ascending: false, nullsFirst: false })
            .order('name', { ascending: true });

        if (error) {
            console.error(`Error fetching listings for category ${categoryId}:`, error);
            throw error;
        }

        return data as DirectoryListingDB[];
    },

    /**
     * Search approved directory listings by text query, category, and/or location.
     */
    async searchDirectoryListings(
        query: string,
        categoryId?: string,
        location?: string,
        page = 1,
        limit = 40,
    ): Promise<{ data: DirectoryListingDB[]; total: number }> {
        let q = supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT, { count: 'exact' })
            .eq('status', 'approved');

        const trimmed = query.trim();
        if (trimmed) {
            // Escape ILIKE wildcards and PostgREST .or() separators in user input
            const safe = trimmed.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/,/g, ' ');
            q = q.or(`name.ilike.%${safe}%,short_description.ilike.%${safe}%`);
        }
        if (categoryId) {
            q = q.eq('category_id', categoryId);
        }
        if (location) {
            const safeLoc = location.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
            if (safeLoc) {
                q = q.ilike('location', `%${safeLoc}%`);
            }
        }

        q = q.order('base_score', { ascending: false })
             .order('is_featured', { ascending: false })
             .order('net_votes', { ascending: false, nullsFirst: false })
             .order('name', { ascending: true })
             .range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await q;
        if (error) {
            console.error('Error searching directory listings:', error);
            throw error;
        }

        return { data: data as DirectoryListingDB[], total: count ?? 0 };
    },

    // ============================================================
    // Landing Page Listings
    // ============================================================

    /**
     * Top community-voted free listings (limit 6, ordered by net_votes DESC)
     */
    async getFreeListings(): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT)
            .eq('is_premium', false)
            .order('net_votes', { ascending: false, nullsFirst: false })
            .limit(6);

        if (error) {
            console.error('Error fetching free listings:', error);
            throw error;
        }

        return data as DirectoryListingDB[];
    },

    /**
     * Premium / promoted listings (limit 6, is_premium = true)
     */
    async getPremiumListings(): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT)
            .eq('is_premium', true)
            .order('base_score', { ascending: false })
            .limit(6);

        if (error) {
            console.error('Error fetching premium listings:', error);
            throw error;
        }

        return data as DirectoryListingDB[];
    },

    /**
     * Signature tier listings (limit 4, is_premium = true, tier = signature)
     */
    async getSignatureListings(): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select(LISTING_LOCATIONS_SELECT)
            .eq('tier', 'signature')
            .eq('is_premium', true)
            .order('base_score', { ascending: false })
            .limit(4);

        if (error) {
            console.error('Error fetching signature listings:', error);
            throw error;
        }

        return data as DirectoryListingDB[];
    },

    async voteForListing(listingId: string, vote: 1 | -1): Promise<{ netVotes: number; userVote: number }> {
        const { data, error } = await supabase
            .rpc('vote_listing', {
                p_listing_id: listingId,
                p_listing_type: 'directory',
                p_vote: vote
            });

        if (error) {
            console.error('Error voting for listing:', error);
            throw error;
        }

        return {
            netVotes: data[0].net_votes,
            userVote: data[0].user_vote
        };
    },

    async getUserVotesBatch(listingIds: string[]): Promise<Record<string, 1 | -1>> {
        const { data, error } = await supabase
            .rpc('get_user_votes_batch', {
                p_listing_ids: listingIds,
                p_listing_type: 'directory'
            });

        if (error) {
            console.error('Error getting user votes batch:', error);
            return {};
        }

        const votes: Record<string, 1 | -1> = {};
        for (const row of (data as { listing_id: string; vote: 1 | -1 }[])) {
            votes[row.listing_id] = row.vote;
        }
        return votes;
    },

    async removeListingVote(listingId: string): Promise<{ netVotes: number }> {
        const { data, error } = await supabase
            .rpc('remove_listing_vote', {
                p_listing_id: listingId,
                p_listing_type: 'directory'
            });

        if (error) {
            console.error('Error removing vote:', error);
            throw error;
        }

        return { netVotes: data[0].net_votes };
    },

    async createDirectoryListing(
        listing: DirectoryListingCreateInput,
        locationIds?: string[]
    ): Promise<DirectoryListingDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (locationIds?.length) validateUUIDs(locationIds);

        const tier = listing.tier || 'explorer';
        const gallery = Array.isArray(listing.gallery) ? listing.gallery : [];
        const limit = TIER_LIMITS[tier] ?? 5;
        if (gallery.length > limit) {
            throw new Error(`Photo limit exceeded for ${tier} tier: max ${limit} photos`);
        }

        const safeData = sanitize({
            name: (listing.name ?? '').slice(0, 200),
            short_description: (listing.short_description ?? '').slice(0, 500),
            category_id: listing.category_id,
            website: listing.website?.slice(0, 500),
            whatsapp: listing.whatsapp?.slice(0, 50),
            gallery,
            location: (listing.location ?? '').slice(0, 200),
            google_map_url: listing.google_map_url?.slice(0, 500),
            video_url: listing.video_url?.slice(0, 500) || null,
            is_featured: false,
            is_verified: false,
            is_premium: false,
            tier,
            base_score: listing.base_score ?? 0,
            descriptions: listing.descriptions ?? {},
            status: 'pending' as const,
            owner_user_id: user.id,
            ...(listing.slug ? { slug: listing.slug.slice(0, 200) } : {}),
            ...(listing.price_level !== undefined ? { price_level: listing.price_level } : {}),
            ...(listing.certifications?.length ? { certifications: listing.certifications } : {}),
            ...(listing.languages_spoken?.length ? { languages_spoken: listing.languages_spoken } : {}),
            ...(listing.newsletter_featured !== undefined ? { newsletter_featured: listing.newsletter_featured } : {}),
        });

        const { data, error } = await supabase
            .from('directory_listings')
            .insert(safeData as unknown as Record<string, unknown>)
            .select()
            .single();

        if (error) {
            console.error('Error creating directory listing:', error);
            throw error;
        }

        if (locationIds?.length) {
            const rows = buildLocationRows(data.id, locationIds);
            const { error: locError } = await supabase.from('listing_locations').insert(rows);
            if (locError) throw new Error(`Listing created but location sync failed: ${locError.message}`);
        }

        return data as DirectoryListingDB;
    },

    async updateDirectoryListing(
        id: string,
        updates: Partial<DirectoryListingDB>,
        locationIds?: string[]
    ): Promise<DirectoryListingDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (locationIds?.length) validateUUIDs(locationIds);

        // Strip fields that should not be updated directly
        const safeUpdates: Record<string, unknown> = { ...updates };
        delete safeUpdates.id;
        delete safeUpdates.created_at;
        delete safeUpdates.updated_at;
        delete safeUpdates.is_verified;
        delete safeUpdates.is_featured;
        delete safeUpdates.base_score;
        delete safeUpdates.subscription_id;
        delete safeUpdates.listing_locations;
        delete safeUpdates.status;
        delete safeUpdates.owner_user_id;
        delete safeUpdates.rejection_reason;

        // Validate gallery length against tier limit
        if (safeUpdates.gallery && Array.isArray(safeUpdates.gallery)) {
            const tier = (safeUpdates.tier as string) || (updates as DirectoryListingDB).tier || 'explorer';
            const limit = TIER_LIMITS[tier] ?? 5;
            if ((safeUpdates.gallery as string[]).length > limit) {
                throw new Error(`Photo limit exceeded for ${tier} tier: max ${limit} photos`);
            }
        }

        const sanitized = sanitize(safeUpdates as Record<string, unknown>);

        const { data, error } = await supabase
            .from('directory_listings')
            .update({ ...sanitized, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating directory listing:', error);
            throw error;
        }

        if (locationIds !== undefined) {
            if (locationIds.length) {
                const rows = buildLocationRows(id, locationIds);
                const { error: upsertError } = await supabase
                    .from('listing_locations')
                    .upsert(rows, { onConflict: 'listing_id,location_id' });
                if (upsertError) throw new Error(`Location sync failed: ${upsertError.message}`);
                const { error: delError } = await supabase
                    .from('listing_locations')
                    .delete()
                    .eq('listing_id', id)
                    .not('location_id', 'in', `(${locationIds.join(',')})`);
                if (delError) throw new Error(`Location cleanup failed: ${delError.message}`);
            } else {
                const { error: delError } = await supabase.from('listing_locations').delete().eq('listing_id', id);
                if (delError) throw new Error(`Failed to clear listing locations: ${delError.message}`);
            }
        }

        return data as DirectoryListingDB;
    },

    async deleteDirectoryListing(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('directory_listings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting directory listing:', error);
            throw error;
        }
    },

    async getDirectoryListingsByStatus(
        status: 'approved' | 'rejected',
        category?: string
    ): Promise<DirectoryListingDB[]> {
        let query = supabase
            .from('directory_listings')
            .select('*')
            .eq('status', status)
            .order('base_score', { ascending: false });
        if (category) query = query.eq('category_id', category);
        const { data, error } = await query;
        if (error) {
            console.error(`Error fetching ${status} listings:`, error);
            throw error;
        }
        return data as DirectoryListingDB[];
    },

    async getPendingDirectoryListings(): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });
        if (error) {
            console.error('Error fetching pending listings:', error);
            throw error;
        }
        return data as DirectoryListingDB[];
    },

    async approveDirectoryListing(id: string): Promise<void> {
        const { data: listing, error } = await supabase
            .from('directory_listings')
            .update({ status: 'approved' })
            .eq('id', id)
            .select('name, owner_user_id')
            .single();
        if (error) {
            console.error('Error approving listing:', error);
            throw error;
        }
        if (listing?.owner_user_id) {
            await retry(() => supabase.functions.invoke('send-email', {
                body: { type: 'listing_approved', userId: listing.owner_user_id, data: { title: listing.name } },
            })).catch(console.error);
        }
    },

    async rejectDirectoryListing(id: string, reason: string): Promise<void> {
        if (reason.length > 1000) throw new Error('Rejection reason must be 1000 characters or fewer');
        const sanitizedReason = sanitizeString(reason);
        const { data: listing, error } = await supabase
            .from('directory_listings')
            .update({ status: 'rejected', rejection_reason: sanitizedReason })
            .eq('id', id)
            .select('name, owner_user_id')
            .single();
        if (error) {
            console.error('Error rejecting listing:', error);
            throw error;
        }
        if (listing?.owner_user_id) {
            await retry(() => supabase.functions.invoke('send-email', {
                body: { type: 'listing_rejected', userId: listing.owner_user_id, data: { title: listing.name, reason: sanitizedReason } },
            })).catch(console.error);
        }
    },

    async trackListingView(listingId: string): Promise<void> {
        const { error } = await supabase.rpc('track_listing_view', { p_listing_id: listingId });
        if (error) console.error('Error tracking view:', error);
    },

    async trackListingClick(listingId: string, clickType: 'whatsapp' | 'website' | 'map'): Promise<void> {
        const { error } = await supabase.rpc('track_listing_click', {
            p_listing_id: listingId,
            p_click_type: clickType
        });
        if (error) console.error('Error tracking click:', error);
    },

    async getDirectoryAnalyticsForOwner(days: number = 30): Promise<ListingAnalyticsSummary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('get_directory_analytics_for_owner', {
            p_owner_id: user.id,
            p_days: days
        });

        if (error) throw error;
        return (data || []) as ListingAnalyticsSummary[];
    },

    async getCategoryAnalyticsAverage(
        categoryId: string,
        days: number = 30
    ): Promise<CategoryAnalyticsAverage | null> {
        const { data, error } = await supabase.rpc('get_category_analytics_average', {
            p_category_id: categoryId,
            p_days: days,
        });
        if (error) throw error;
        return (data?.[0] ?? null) as CategoryAnalyticsAverage | null;
    }
};