import { supabase } from '../supabase';
import { DirectoryListingDB } from '../../types/models';

// eslint-disable-next-line no-control-regex
const STRIP_CONTROL = /[\r\n\x00-\x1f\x7f]/g;

const sanitize = <T extends Record<string, unknown>>(obj: T): T => {
    const result: Record<string, unknown> = { ...obj };
    for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'string') {
            result[key] = value.replace(STRIP_CONTROL, '').trim();
        }
    }
    return result as T;
};

export const directoryService = {
    async getDirectoryListings(page: number = 1, limit: number = 20, category?: string): Promise<{ data: DirectoryListingDB[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('directory_listings')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

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
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching directory listing:', error);
            throw error;
        }

        return data as DirectoryListingDB | null;
    },

    async getDirectoryListingsByCategory(categoryId: string): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select('*')
            .eq('category_id', categoryId)
            .order('is_featured', { ascending: false })
            .order('net_votes', { ascending: false, nullsFirst: false })
            .order('name', { ascending: true });

        if (error) {
            console.error(`Error fetching listings for category ${categoryId}:`, error);
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

    async createDirectoryListing(listing: Omit<DirectoryListingDB, 'id' | 'created_at' | 'updated_at'>): Promise<DirectoryListingDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const safeData = sanitize({
            name: (listing.name ?? '').slice(0, 200),
            short_description: (listing.short_description ?? '').slice(0, 500),
            category_id: listing.category_id,
            website: listing.website?.slice(0, 500),
            whatsapp: listing.whatsapp?.slice(0, 50),
            gallery: Array.isArray(listing.gallery) ? listing.gallery : [],
            location: (listing.location ?? '').slice(0, 200),
            google_map_url: listing.google_map_url?.slice(0, 500),
            is_featured: false,
            is_verified: false,
            ...(listing.price_level !== undefined ? { price_level: listing.price_level } : {}),
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

        return data as DirectoryListingDB;
    },

    async updateDirectoryListing(id: string, updates: Partial<DirectoryListingDB>): Promise<DirectoryListingDB> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Strip fields that should not be updated directly
        const safeUpdates: Record<string, unknown> = { ...updates };
        delete safeUpdates.id;
        delete safeUpdates.created_at;
        delete safeUpdates.updated_at;
        delete safeUpdates.is_verified;
        delete safeUpdates.is_featured;

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
    }
};
