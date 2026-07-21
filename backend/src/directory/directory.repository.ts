import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const LISTING_LOCATIONS_SELECT =
  '*, listing_locations(id, location_id, display_order, locations(id, name))';

@Injectable()
export class DirectoryRepository {
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

  async getDirectoryListings(page: number, limit: number, category?: string, sortBy = 'base_score') {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client
      .from('directory_listings')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: false });

    if (category) query = query.eq('category_id', category);

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);

    return { data: data || [], count: count || 0 };
  }

  async getDirectoryListingById(id: string) {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async getDirectoryListingBySlug(slug: string) {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async getDirectoryListingsByCategory(categoryId: string) {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('category_id', categoryId)
      .order('base_score', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('net_votes', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async searchDirectoryListings(query: string, categoryId?: string, location?: string, page = 1, limit = 40) {
    let q = this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT, { count: 'exact' })
      .eq('status', 'approved');

    const trimmed = query.trim();
    if (trimmed) {
      const safe = trimmed
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/,/g, ' ');
      q = q.or(`name.ilike.%${safe}%,short_description.ilike.%${safe}%`);
    }
    if (categoryId) q = q.eq('category_id', categoryId);
    if (location) {
      const safeLoc = location.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
      if (safeLoc) q = q.ilike('location', `%${safeLoc}%`);
    }

    q = q
      .order('base_score', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('net_votes', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    return { data: data || [], count: count || 0 };
  }

  async getFreeListings() {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('is_premium', false)
      .order('net_votes', { ascending: false, nullsFirst: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPremiumListings() {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('is_premium', true)
      .order('base_score', { ascending: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getSignatureListings() {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('tier', 'signature')
      .eq('is_premium', true)
      .order('base_score', { ascending: false })
      .limit(4);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getRecentlyClaimedListings(limit = 6) {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .not('claimed_at', 'is', null)
      .eq('status', 'approved')
      .order('claimed_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async voteForListing(listingId: string, vote: 1 | -1) {
    const { data, error } = await this.client.rpc('vote_listing', {
      p_listing_id: listingId,
      p_listing_type: 'directory',
      p_vote: vote,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserVotesBatch(listingIds: string[]) {
    const { data, error } = await this.client.rpc('get_user_votes_batch', {
      p_listing_ids: listingIds,
      p_listing_type: 'directory',
    });
    if (error) return [];
    return data || [];
  }

  async removeListingVote(listingId: string) {
    const { data, error } = await this.client.rpc('remove_listing_vote', {
      p_listing_id: listingId,
      p_listing_type: 'directory',
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getMyDirectoryListings(userId: string) {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async insertDirectoryListing(listingData: any) {
    const { data, error } = await this.client
      .from('directory_listings')
      .insert(listingData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async insertListingLocations(rows: any[]) {
    const { error } = await this.client.from('listing_locations').insert(rows);
    if (error) throw new Error(error.message);
  }

  async getDirectoryListingOwner(id: string) {
    const { data } = await this.client
      .from('directory_listings')
      .select('owner_user_id')
      .eq('id', id)
      .single();
    return data;
  }

  async updateDirectoryListing(id: string, updates: any) {
    const { data, error } = await this.client
      .from('directory_listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertListingLocations(rows: any[]) {
    const { error } = await this.client
      .from('listing_locations')
      .upsert(rows, { onConflict: 'listing_id,location_id' });
    if (error) throw new Error(error.message);
  }

  async deleteListingLocations(listingId: string, locationIdsToKeep?: string[]) {
    let query = this.client.from('listing_locations').delete().eq('listing_id', listingId);
    if (locationIdsToKeep && locationIdsToKeep.length > 0) {
      query = query.not('location_id', 'in', `(${locationIdsToKeep.join(',')})`);
    }
    await query;
  }

  async deleteDirectoryListing(id: string) {
    const { error } = await this.client.from('directory_listings').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async trackListingView(listingId: string) {
    await this.client.rpc('track_listing_view', { p_listing_id: listingId });
  }

  async trackListingClick(listingId: string, clickType: string) {
    await this.client.rpc('track_listing_click', {
      p_listing_id: listingId,
      p_click_type: clickType,
    });
  }

  async getDirectoryListingsByStatus(status: 'approved' | 'rejected', category?: string) {
    let query = this.client
      .from('directory_listings')
      .select('*')
      .eq('status', status)
      .order('base_score', { ascending: false });
    if (category) query = query.eq('category_id', category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getPendingDirectoryListings() {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateListingStatus(id: string, updates: any) {
    const { data, error } = await this.client
      .from('directory_listings')
      .update(updates)
      .eq('id', id)
      .select('name, owner_user_id')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getDirectoryAnalyticsForOwner(userId: string, days: number) {
    const { data, error } = await this.client.rpc('get_directory_analytics_for_owner', {
      p_owner_id: userId,
      p_days: days,
    });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getCategoryAnalyticsAverage(categoryId: string, days: number) {
    const { data, error } = await this.client.rpc('get_category_analytics_average', {
      p_category_id: categoryId,
      p_days: days,
    });
    if (error) throw new Error(error.message);
    return data?.[0] ?? null;
  }

  async getListingAddons(listingId: string) {
    const { data, error } = await this.client
      .from('listing_addons')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async insertListingClaim(claimData: any) {
    const { data, error } = await this.client
      .from('listing_claims')
      .insert(claimData)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async verifyClaimEmail(token: string) {
    const { data, error } = await this.client.rpc('verify_claim_email', { p_token: token });
    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  async getListingClaims() {
    const { data, error } = await this.client
      .from('listing_claims')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async callApproveListingClaimRpc(claimId: string) {
    const { data, error } = await this.client.rpc('approve_listing_claim', { p_claim_id: claimId });
    return { data, error };
  }

  async callRejectListingClaimRpc(claimId: string, reason: string) {
    const { data, error } = await this.client.rpc('reject_listing_claim', {
      p_claim_id: claimId,
      p_reason: reason,
    });
    return { data, error };
  }

  async getListingClaimById(id: string) {
    const { data } = await this.client
      .from('listing_claims')
      .select('email, business_name')
      .eq('id', id)
      .single();
    return data;
  }

  async invokeFunction(functionName: string, payload: any) {
    try {
      const { data, error } = await this.client.functions.invoke(functionName, payload);
      return { data, error };
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }
}
