import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PropertiesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getPropertiesByIds(ids: string[]) {
    const { data, error } = await this.client
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url)')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return data;
  }

  async insertProperty(data: any, userId: string) {
    const { data: property, error } = await this.client
      .from('properties')
      .insert([{ ...data, host_id: userId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return property;
  }

  async getProperties(queryOptions: any) {
    const {
      page = 1,
      limit = 20,
      filters,
      location,
      allowedIds,
      sort = 'newest',
    } = queryOptions;

    let query = this.client
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url), reviews(count)', {
        count: 'exact',
      })
      .eq('status', 'approved');

    if (allowedIds && allowedIds.length > 0) query = query.in('id', allowedIds);

    if (location && location !== 'all') {
      const safeLocation = location
        .replace(/[%_,.()"']/g, '')
        .trim()
        .slice(0, 100);
      if (safeLocation)
        query = query.or(
          `location.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`,
        );
    }

    if (filters) {
      if (filters.priceRange) {
        query = query.gte('price_per_night', filters.priceRange[0]);
        if (filters.priceRange[1] > 0)
          query = query.lte('price_per_night', filters.priceRange[1]);
      }
      if (filters.types?.length > 0)
        query = query.in(
          'type',
          filters.types.map((t: string) => t.toLowerCase()),
        );
      if (filters.minGuests > 1)
        query = query.gte('max_guests', filters.minGuests);
      if (filters.minBedrooms > 0)
        query = query.gte('bedrooms', filters.minBedrooms);
      if (filters.minBeds > 1) query = query.gte('beds', filters.minBeds);
      if (filters.minBathrooms > 1)
        query = query.gte('bathrooms', filters.minBathrooms);
      if (filters.hasPhotos) query = query.not('images', 'is', null);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price_per_night', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_per_night', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    query = query.order('id', { ascending: true });

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async getPropertyByUUID(id: string) {
    const { data, error } = await this.client
      .from('properties')
      .select(
        '*, host:profiles(full_name, avatar_url, email, phone, company_name)',
      )
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async getPropertyByRefId(refId: number) {
    const { data, error } = await this.client.rpc('get_property_by_ref_id', {
      ref_id_param: refId,
    });
    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  async getAvailableProperties(checkIn: string, checkOut: string) {
    const { data, error } = await this.client.rpc('get_available_properties', {
      check_in_date: checkIn,
      check_out_date: checkOut,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getPropertiesByHost(hostId: string) {
    const { data, error } = await this.client
      .from('properties')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getAdminProperties(statusFilter: string = 'all', page = 1, limit = 50) {
    let query = this.client.from('properties').select('*', { count: 'exact' });
    if (statusFilter && statusFilter !== 'all')
      query = query.eq('status', statusFilter);
    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async getPropertyHostId(id: string) {
    const { data } = await this.client
      .from('properties')
      .select('host_id, title')
      .eq('id', id)
      .single();
    return data;
  }

  async updateProperty(id: string, updates: any) {
    const { error } = await this.client
      .from('properties')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deletePropertyCascading(id: string) {
    await this.client.from('reviews').delete().eq('property_id', id);
    await this.client
      .from('property_availability')
      .delete()
      .eq('property_id', id);
    await this.client
      .from('property_ical_feeds')
      .delete()
      .eq('property_id', id);
    await this.client.from('favorites').delete().eq('item_id', id);

    const { error } = await this.client
      .from('properties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async getPropertyTypes() {
    const { data, error } = await this.client.from('properties').select('type');
    if (error) throw new Error(error.message);
    return [...new Set(data.map((p: any) => p.type))];
  }

  async getPropertyLocations(type: string) {
    const { data, error } = await this.client
      .from('properties')
      .select('location')
      .eq('type', type);
    if (error) throw new Error(error.message);
    return [...new Set(data.map((p: any) => p.location))];
  }

  async getPropertiesByLocation(
    type: string,
    location: string,
    page = 1,
    limit = 20,
  ) {
    const from = (page - 1) * limit;
    const { data, error, count } = await this.client
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('type', type)
      .eq('location', location)
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async getICalFeeds(propertyId: string) {
    const { data, error } = await this.client
      .from('property_ical_feeds')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async insertICalFeed(propertyId: string, name: string, url: string) {
    const { data, error } = await this.client
      .from('property_ical_feeds')
      .insert([{ property_id: propertyId, name, url }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async syncICalFeed(feedId: string) {
    const { data: result, error: rpcError } = await this.client.rpc(
      'sync_ical_feed',
      { feed_id: feedId },
    );
    if (rpcError) throw rpcError;
    return result;
  }

  async getICalFeedPropertyId(id: string) {
    const { data } = await this.client
      .from('property_ical_feeds')
      .select('property_id')
      .eq('id', id)
      .single();
    return data?.property_id as string | undefined;
  }

  async removeICalFeed(id: string) {
    const { error } = await this.client
      .from('property_ical_feeds')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
  ) {
    const { data, error } = await this.client
      .from('property_availability')
      .select('*, feed:property_ical_feeds(name)')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAvailability(propertyId: string, dates: string[]) {
    const { error } = await this.client
      .from('property_availability')
      .delete()
      .eq('property_id', propertyId)
      .in('date', dates);
    if (error) throw new Error(error.message);
  }

  async insertAvailability(entries: any[]) {
    const { error } = await this.client
      .from('property_availability')
      .insert(entries);
    if (error) throw new Error(error.message);
  }

  async syncPropertyCalendar(propertyId: string) {
    const { data, error } = await this.client.functions.invoke('sync-ical', {
      body: { propertyId },
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getUnavailableDates(propertyId: string, today: string) {
    const { data, error } = await this.client
      .from('property_availability')
      .select('date')
      .eq('property_id', propertyId)
      .gte('date', today)
      .neq('status', 'available');
    if (error) throw new Error(error.message);
    return (data || []).map((row: any) => row.date);
  }

  async getReviews(propertyId: string, from: number, to: number) {
    const { data, error, count } = await this.client
      .from('reviews')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('property_id', propertyId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async getReviewCount(propertyId: string) {
    const { count, error } = await this.client
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('is_hidden', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async getExistingReview(propertyId: string, userId: string) {
    const { data, error } = await this.client
      .from('reviews')
      .select('id')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('getExistingReview error:', error);
    }
    return data;
  }

  async getBookingCountForReview(propertyId: string, userId: string) {
    const { count, error } = await this.client
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('item_id', propertyId)
      .eq('item_type', 'property')
      .in('status', ['confirmed', 'completed']);
    if (error) throw new Error(error.message);
    return count;
  }

  async insertReview(review: any) {
    const { error } = await this.client
      .from('reviews')
      .insert([review])
      .select()
      .single();
    if (error) throw new Error(error.message);
  }

  async getReviewUserId(reviewId: string) {
    const { data } = await this.client
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();
    return data;
  }

  async deleteReview(reviewId: string) {
    const { error } = await this.client
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw new Error(error.message);
  }

  async updateReviewFlag(
    reviewId: string,
    isFlagged: boolean,
    isHidden: boolean,
    excludeUserId?: string,
  ) {
    let query = this.client
      .from('reviews')
      .update({ is_flagged: isFlagged, is_hidden: isHidden })
      .eq('id', reviewId);
    if (excludeUserId) query = query.neq('user_id', excludeUserId);
    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async getFlaggedReviews(from: number, to: number) {
    const { data, error, count } = await this.client
      .from('reviews')
      .select('*, user:profiles(full_name, avatar_url), properties(title)', {
        count: 'exact',
      })
      .eq('is_flagged', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async bulkDeleteReviews(reviewIds: string[]) {
    const { error } = await this.client
      .from('reviews')
      .delete()
      .in('id', reviewIds);
    if (error) throw new Error(error.message);
  }

  // --- ADDED MISSING FUNCTIONS FOR SERVICE ---

  async getProfile(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('full_name, avatar_url, email, phone, company_name, role')
      .eq('id', userId)
      .single();
    return data;
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  invokeEmailFunction(payload: any) {
    this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err) => console.error(err));
  }
}
