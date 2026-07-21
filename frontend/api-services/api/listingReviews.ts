import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { ListingReview } from '../../types/models';

export const listingReviewsService = {
    async getListingReviews(listingId: string, page = 1, limit = 20) {
        const from = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('listing_reviews')
            .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
            .eq('listing_id', listingId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;
        return { data: (data || []) as ListingReview[], total: count || 0 };
    },

    async submitListingReview(listingId: string, rating: number, comment: string): Promise<ListingReview> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('listing_reviews')
            .insert({ listing_id: listingId, user_id: user.id, rating, comment })
            .select()
            .single();

        if (error) throw error;
        return data as ListingReview;
    },

    async getUserReviewForListing(listingId: string): Promise<ListingReview | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data } = await supabase
            .from('listing_reviews')
            .select('*')
            .eq('listing_id', listingId)
            .eq('user_id', user.id)
            .maybeSingle();

        return data as ListingReview | null;
    },

    // Admin methods
    async getPendingReviews(page = 1, limit = 50) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can view pending reviews');

        const from = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('listing_reviews')
            .select('*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)', { count: 'exact' })
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .range(from, from + limit - 1);

        if (error) throw error;
        return { data: (data || []) as ListingReview[], total: count || 0 };
    },

    async getReviewsByStatus(status: 'pending' | 'approved' | 'rejected', page = 1, limit = 50) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can view all reviews');

        const from = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('listing_reviews')
            .select('*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)', { count: 'exact' })
            .eq('status', status)
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw error;
        return { data: (data || []) as ListingReview[], total: count || 0 };
    },

    async approveReview(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can approve reviews');

        const { error } = await supabase.from('listing_reviews').update({ status: 'approved' }).eq('id', id);
        if (error) throw error;
    },

    async rejectReview(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can reject reviews');

        const { error } = await supabase.from('listing_reviews').update({ status: 'rejected' }).eq('id', id);
        if (error) throw error;
    },

    async deleteReview(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can delete reviews');

        const { error } = await supabase.from('listing_reviews').delete().eq('id', id);
        if (error) throw error;
    },
};
