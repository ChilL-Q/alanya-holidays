import { supabase } from '../supabase';
import { DirectoryListingDB } from '../../types/models';

const sanitize = <T extends Record<string, unknown>>(obj: T): T => {
    const result: Record<string, unknown> = { ...obj };
    for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'string') {
            result[key] = value.replace(/[\r\n\x00-\x1f\x7f]/g, '').trim();
        }
    }
    return result as T;
};

export const directoryService = {
    async getDirectoryListings(): Promise<DirectoryListingDB[]> {
        const { data, error } = await supabase
            .from('directory_listings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching directory listings:', error);
            throw error;
        }

        return data as DirectoryListingDB[];
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
            .order('name', { ascending: true });

        if (error) {
            console.error(`Error fetching listings for category ${categoryId}:`, error);
            throw error;
        }

        return data as DirectoryListingDB[];
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
        const { id: _id, created_at: _, updated_at: __, is_verified, is_featured, ...safeUpdates } = updates;

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
