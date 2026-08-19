import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  DirectoryListingRecord,
  DirectoryClaimRecord,
  VoteResult,
  ClaimRpcResult,
} from './types/directory.types';
import { UserListingVote } from './dto/directory-vote.dto';

const LISTING_LOCATIONS_SELECT =
  '*, listing_locations(id, location_id, display_order, locations(id, name))';

@Injectable()
export class DirectoryRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single<{ role: string }>();
    return data?.role ?? undefined;
  }

  async getDirectoryListings(
    page: number,
    limit: number,
    category?: string,
    sortBy = 'base_score',
  ): Promise<{ data: DirectoryListingRecord[]; count: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const SORT_COLUMN_MAP: Record<string, string> = {
      rating: 'reviews_average',
      reviews_average: 'reviews_average',
      reviews: 'reviews_count',
      reviews_count: 'reviews_count',
      base_score: 'base_score',
      created_at: 'created_at',
      name: 'name',
      net_votes: 'net_votes',
      popular: 'net_votes',
      newest: 'created_at',
    };
    const orderColumn = SORT_COLUMN_MAP[sortBy] ?? 'base_score';

    let query = this.client
      .from('directory_listings')
      .select('*', { count: 'exact' })
      .order(orderColumn, { ascending: false });

    if (category) query = query.eq('category_id', category);

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);

    return {
      data: (data as DirectoryListingRecord[]) ?? [],
      count: count ?? 0,
    };
  }

  async getDirectoryListingById(
    id: string,
  ): Promise<DirectoryListingRecord | null> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('id', id)
      .single<DirectoryListingRecord>();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  }

  async getDirectoryListingBySlug(
    slug: string,
  ): Promise<DirectoryListingRecord | null> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('slug', slug)
      .single<DirectoryListingRecord>();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data || null;
  }

  async getDirectoryListingsByCategory(
    categoryId: string,
  ): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('category_id', categoryId)
      .order('base_score', { ascending: false })
      .order('is_featured', { ascending: false })
      .order('net_votes', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async searchDirectoryListings(
    query: string,
    categoryId?: string,
    location?: string,
    page = 1,
    limit = 40,
  ): Promise<{ data: DirectoryListingRecord[]; count: number }> {
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
    return {
      data: (data as DirectoryListingRecord[]) ?? [],
      count: count ?? 0,
    };
  }

  async getFreeListings(): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('is_premium', false)
      .order('net_votes', { ascending: false, nullsFirst: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async getPremiumListings(): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('is_premium', true)
      .order('base_score', { ascending: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async getSignatureListings(): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .eq('tier', 'signature')
      .eq('is_premium', true)
      .order('base_score', { ascending: false })
      .limit(4);
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async getRecentlyClaimedListings(
    limit = 6,
  ): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select(LISTING_LOCATIONS_SELECT)
      .not('claimed_at', 'is', null)
      .eq('status', 'approved')
      .order('claimed_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async voteForListing(
    listingId: string,
    vote: 1 | -1,
    userId: string,
  ): Promise<VoteResult[]> {
    const res = await this.client.rpc('vote_listing', {
      p_listing_id: listingId,
      p_listing_type: 'directory',
      p_vote: vote,
      p_user_id: userId,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data as VoteResult[]) ?? [];
  }

  async getUserVotesBatch(
    listingIds: string[],
    userId: string,
  ): Promise<UserListingVote[]> {
    const res = await this.client.rpc('get_user_votes_batch', {
      p_listing_ids: listingIds,
      p_listing_type: 'directory',
      p_user_id: userId,
    });
    if (res.error) return [];
    return (res.data as UserListingVote[]) ?? [];
  }

  async removeListingVote(
    listingId: string,
    userId: string,
  ): Promise<VoteResult[]> {
    const res = await this.client.rpc('remove_listing_vote', {
      p_listing_id: listingId,
      p_listing_type: 'directory',
      p_user_id: userId,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data as VoteResult[]) ?? [];
  }

  async getMyDirectoryListings(
    userId: string,
  ): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async insertDirectoryListing(
    listingData: Record<string, unknown>,
  ): Promise<DirectoryListingRecord> {
    const { data, error } = await this.client
      .from('directory_listings')
      .insert(listingData)
      .select()
      .single<DirectoryListingRecord>();
    if (error) throw new Error(error.message);
    return data;
  }

  async insertListingLocations(rows: Record<string, unknown>[]): Promise<void> {
    const { error } = await this.client.from('listing_locations').insert(rows);
    if (error) throw new Error(error.message);
  }

  async getDirectoryListingOwner(
    id: string,
  ): Promise<{ owner_user_id?: string | null } | null> {
    const { data } = await this.client
      .from('directory_listings')
      .select('owner_user_id')
      .eq('id', id)
      .single<{ owner_user_id?: string | null }>();
    return data;
  }

  async updateDirectoryListing(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<DirectoryListingRecord> {
    const { data, error } = await this.client
      .from('directory_listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single<DirectoryListingRecord>();
    if (error) throw new Error(error.message);
    return data;
  }

  async upsertListingLocations(rows: Record<string, unknown>[]): Promise<void> {
    const { error } = await this.client
      .from('listing_locations')
      .upsert(rows, { onConflict: 'listing_id,location_id' });
    if (error) throw new Error(error.message);
  }

  async deleteListingLocations(
    listingId: string,
    locationIdsToKeep?: string[],
  ): Promise<void> {
    let query = this.client
      .from('listing_locations')
      .delete()
      .eq('listing_id', listingId);
    if (locationIdsToKeep && locationIdsToKeep.length > 0) {
      query = query.not(
        'location_id',
        'in',
        `(${locationIdsToKeep.join(',')})`,
      );
    }
    await query;
  }

  async deleteDirectoryListing(id: string): Promise<void> {
    const { error } = await this.client
      .from('directory_listings')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async trackListingView(listingId: string): Promise<void> {
    await this.client.rpc('track_listing_view', { p_listing_id: listingId });
  }

  async trackListingClick(listingId: string, clickType: string): Promise<void> {
    await this.client.rpc('track_listing_click', {
      p_listing_id: listingId,
      p_click_type: clickType,
    });
  }

  async getDirectoryListingsByStatus(
    status: 'approved' | 'rejected',
    category?: string,
  ): Promise<DirectoryListingRecord[]> {
    let query = this.client
      .from('directory_listings')
      .select('*')
      .eq('status', status)
      .order('base_score', { ascending: false });
    if (category) query = query.eq('category_id', category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async getPendingDirectoryListings(): Promise<DirectoryListingRecord[]> {
    const { data, error } = await this.client
      .from('directory_listings')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as DirectoryListingRecord[]) || [];
  }

  async updateListingStatus(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<{ name?: string; owner_user_id?: string | null } | null> {
    const { data, error } = await this.client
      .from('directory_listings')
      .update(updates)
      .eq('id', id)
      .select('name, owner_user_id')
      .single<{ name?: string; owner_user_id?: string | null }>();
    if (error) throw new Error(error.message);
    return data;
  }

  async getDirectoryAnalyticsForOwner(
    userId: string,
    days: number,
  ): Promise<Record<string, unknown>[]> {
    const res = await this.client.rpc('get_directory_analytics_for_owner', {
      p_owner_id: userId,
      p_days: days,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data as Record<string, unknown>[]) || [];
  }

  async getCategoryAnalyticsAverage(
    categoryId: string,
    days: number,
  ): Promise<Record<string, unknown> | null> {
    const res = await this.client.rpc('get_category_analytics_average', {
      p_category_id: categoryId,
      p_days: days,
    });
    if (res.error) throw new Error(res.error.message);
    const rows = res.data as Record<string, unknown>[] | null;
    return rows?.[0] ?? null;
  }

  async getListingAddons(
    listingId: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('listing_addons')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async insertListingClaim(
    claimData: Record<string, unknown>,
  ): Promise<DirectoryClaimRecord> {
    const { data, error } = await this.client
      .from('listing_claims')
      .insert(claimData)
      .select()
      .single<DirectoryClaimRecord>();
    if (error) throw new Error(error.message);
    return data;
  }

  async verifyClaimEmail(token: string): Promise<DirectoryClaimRecord | null> {
    const res = await this.client.rpc('verify_claim_email', {
      p_token: token,
    });
    const rows = res.data as DirectoryClaimRecord[] | null;
    if (res.error || !rows || rows.length === 0) return null;
    return rows[0] || null;
  }

  async getListingClaims(): Promise<DirectoryClaimRecord[]> {
    try {
      const { data, error } = await this.client
        .from('listing_claims')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        return [];
      }
      return (data as DirectoryClaimRecord[]) || [];
    } catch {
      return [];
    }
  }

  async callApproveListingClaimRpc(
    claimId: string,
    userId: string,
  ): Promise<{
    data: ClaimRpcResult[] | null;
    error: Error | null;
  }> {
    const res = await this.client.rpc('approve_listing_claim', {
      p_claim_id: claimId,
      p_user_id: userId,
    });
    return {
      data: (res.data as ClaimRpcResult[]) ?? null,
      error: res.error ? new Error(res.error.message) : null,
    };
  }

  async callRejectListingClaimRpc(
    claimId: string,
    reason: string,
    userId: string,
  ): Promise<{
    data: ClaimRpcResult[] | null;
    error: Error | null;
  }> {
    const res = await this.client.rpc('reject_listing_claim', {
      p_claim_id: claimId,
      p_reason: reason,
      p_user_id: userId,
    });
    return {
      data: (res.data as ClaimRpcResult[]) ?? null,
      error: res.error ? new Error(res.error.message) : null,
    };
  }

  async getListingClaimById(
    id: string,
  ): Promise<{ email: string; business_name: string } | null> {
    const { data } = await this.client
      .from('listing_claims')
      .select('email, business_name')
      .eq('id', id)
      .single<{ email: string; business_name: string }>();
    return data;
  }

  async invokeFunction(
    functionName: string,
    payload: Record<string, unknown>,
  ): Promise<{
    data?: { url?: string; error?: string };
    error?: Error | null;
  }> {
    try {
      const res = await this.client.functions.invoke<{
        url?: string;
        error?: string;
      }>(functionName, payload);
      const funcError = res.error as { message?: string } | null;
      return {
        data: res.data ?? undefined,
        error: funcError
          ? new Error(funcError.message || 'Function invocation failed')
          : null,
      };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e : new Error(String(e)) };
    }
  }
}
