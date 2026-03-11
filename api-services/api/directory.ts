import { supabase } from '../supabase';
import { DirectoryListingDB } from '../../types/models';

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
        const { data, error } = await supabase
            .from('directory_listings')
            .insert(listing)
            .select()
            .single();

        if (error) {
            console.error('Error creating directory listing:', error);
            throw error;
        }

        return data as DirectoryListingDB;
    },

    async updateDirectoryListing(id: string, updates: Partial<DirectoryListingDB>): Promise<DirectoryListingDB> {
        const { data, error } = await supabase
            .from('directory_listings')
            .update({ ...updates, updated_at: new Date().toISOString() })
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
