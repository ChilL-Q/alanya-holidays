import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReviewsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  async getListingReviews(listingId: string, from: number, to: number) {
    const { data, error, count } = await this.client
      .from('listing_reviews')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('listing_id', listingId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { data: data || [], count: count || 0 };
  }

  async insertListingReview(listingId: string, rating: number, comment: string, userId: string) {
    const { data, error } = await this.client
      .from('listing_reviews')
      .insert({ listing_id: listingId, user_id: userId, rating, comment })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getUserReviewForListing(listingId: string, userId: string) {
    const { data } = await this.client
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .maybeSingle();

    return data;
  }

  async getReviewsByStatus(status: string, from: number, to: number, ascending: boolean) {
    const { data, error, count } = await this.client
      .from('listing_reviews')
      .select(
        '*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)',
        { count: 'exact' },
      )
      .eq('status', status)
      .order('created_at', { ascending })
      .range(from, to);

    if (error) throw new Error(error.message);
    return { data: data || [], count: count || 0 };
  }

  async updateReviewStatus(id: string, status: string) {
    const { error } = await this.client
      .from('listing_reviews')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteReview(id: string) {
    const { error } = await this.client
      .from('listing_reviews')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}
