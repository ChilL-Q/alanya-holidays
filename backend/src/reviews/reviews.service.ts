import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getListingReviews(listingId: string, page = 1, limit = 20) {
    const supabase = this.supabaseService.getClient();
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('listing_reviews')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('listing_id', listingId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data || [], total: count || 0 };
  }

  async submitListingReview(listingId: string, rating: number, comment: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('listing_reviews')
      .insert({ listing_id: listingId, user_id: userId, rating, comment })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getUserReviewForListing(listingId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase
      .from('listing_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .maybeSingle();

    return data || null;
  }

  private async checkAdmin(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data?.role !== 'admin') throw new UnauthorizedException('Admin only');
    return supabase;
  }

  async getPendingReviews(page = 1, limit = 50, requestUserId: string) {
    const supabase = await this.checkAdmin(requestUserId);
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('listing_reviews')
      .select('*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)', { count: 'exact' })
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data || [], total: count || 0 };
  }

  async getReviewsByStatus(status: string, page = 1, limit = 50, requestUserId: string) {
    const supabase = await this.checkAdmin(requestUserId);
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('listing_reviews')
      .select('*, user:profiles(full_name, avatar_url), listing:directory_listings(id, name)', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data || [], total: count || 0 };
  }

  async approveReview(id: string, requestUserId: string) {
    const supabase = await this.checkAdmin(requestUserId);
    const { error } = await supabase.from('listing_reviews').update({ status: 'approved' }).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async rejectReview(id: string, requestUserId: string) {
    const supabase = await this.checkAdmin(requestUserId);
    const { error } = await supabase.from('listing_reviews').update({ status: 'rejected' }).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async deleteReview(id: string, requestUserId: string) {
    const supabase = await this.checkAdmin(requestUserId);
    const { error } = await supabase.from('listing_reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
