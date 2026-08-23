import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { Database } from '../../../../../shared/types/database.types';
import {
  IPropertiesRepository,
  PropertyQueryOptions,
  PropertyEntity,
} from '../../domain';
import { PropertyMapper } from '../mappers/property.mapper';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];
type ICalFeedInsert =
  Database['public']['Tables']['property_ical_feeds']['Insert'];

@Injectable()
export class SupabasePropertiesRepository implements IPropertiesRepository {
  private readonly logger = new Logger(SupabasePropertiesRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  // ============================================
  // Domain Entity Methods
  // ============================================

  async findById(id: string): Promise<PropertyEntity | null> {
    const { data, error } = await this.client
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return PropertyMapper.toDomain(data);
  }

  async save(property: PropertyEntity): Promise<PropertyEntity> {
    const persistenceData = PropertyMapper.toPersistence(property);
    const { data, error } = await this.client
      .from('properties')
      .upsert(persistenceData as unknown as PropertyInsert)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save property: ${error.message}`);
    }
    return PropertyMapper.toDomain(data);
  }

  // ============================================
  // Properties Queries & Persistence
  // ============================================

  async getPropertiesByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url)')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async insertProperty(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const payload = [
      { ...data, host_id: userId },
    ] as unknown as PropertyInsert[];
    const { data: property, error } = await this.client
      .from('properties')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return property;
  }

  async getProperties(
    queryOptions: PropertyQueryOptions,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
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

    if (allowedIds && allowedIds.length > 0) {
      query = query.in(
        'id',
        Array.isArray(allowedIds) ? allowedIds : [allowedIds],
      );
    }

    if (location && location !== 'all') {
      const safeLocation = location
        .replace(/[%_,.()"']/g, '')
        .trim()
        .slice(0, 100);
      if (safeLocation) {
        query = query.or(
          `location.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`,
        );
      }
    }

    if (filters) {
      if (filters.priceRange) {
        query = query.gte('price_per_night', filters.priceRange[0]);
        if (filters.priceRange[1] > 0) {
          query = query.lte('price_per_night', filters.priceRange[1]);
        }
      }
      if (filters.types && filters.types.length > 0) {
        query = query.in(
          'type',
          filters.types.map((t: string) => t.toLowerCase()),
        );
      }
      if (filters.minGuests && filters.minGuests > 1) {
        query = query.gte('max_guests', filters.minGuests);
      }
      if (filters.minBedrooms && filters.minBedrooms > 0) {
        query = query.gte('bedrooms', filters.minBedrooms);
      }
      if (filters.minBeds && filters.minBeds > 1) {
        query = query.gte('beds', filters.minBeds);
      }
      if (filters.minBathrooms && filters.minBathrooms > 1) {
        query = query.gte('bathrooms', filters.minBathrooms);
      }
      if (filters.hasPhotos) {
        query = query.not('images', 'is', null);
      }
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
    return { data: data ?? [], count };
  }

  async getPropertyByUUID(id: string): Promise<Record<string, unknown> | null> {
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

  async getPropertyByRefId(
    refId: number,
  ): Promise<Record<string, unknown> | null> {
    const res = await this.client.rpc('get_property_by_ref_id', {
      ref_id_param: refId,
    });
    if (res.error || !res.data || (res.data as unknown[]).length === 0)
      return null;
    return (res.data as Record<string, unknown>[])[0] ?? null;
  }

  async getAvailableProperties(
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, unknown>[]> {
    const res = await this.client.rpc('get_available_properties', {
      check_in_date: checkIn,
      check_out_date: checkOut,
    });
    if (res.error) throw new Error(res.error.message);
    return (res.data as Record<string, unknown>[]) ?? [];
  }

  async getPropertiesByHost(
    hostId: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('properties')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getAdminProperties(
    statusFilter: string = 'all',
    page = 1,
    limit = 50,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    let query = this.client.from('properties').select('*', { count: 'exact' });
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count };
  }

  async getPropertyHostId(
    id: string,
  ): Promise<{ host_id: string; title: string } | null> {
    const { data } = await this.client
      .from('properties')
      .select('host_id, title')
      .eq('id', id)
      .single();

    if (!data || !data.host_id) return null;
    return { host_id: data.host_id, title: data.title };
  }

  async updateProperty(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client
      .from('properties')
      .update(updates as unknown as PropertyUpdate)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deletePropertyCascading(id: string): Promise<void> {
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

  // ============================================
  // Catalog
  // ============================================

  async getPropertyTypes(): Promise<string[]> {
    const { data, error } = await this.client.from('properties').select('type');
    if (error) throw new Error(error.message);
    return Array.from(
      new Set<string>(
        (data || []).map((p: { type: string | null }) => p.type || ''),
      ),
    ).filter(Boolean);
  }

  async getPropertyLocations(type: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('properties')
      .select('location')
      .eq('type', type);
    if (error) throw new Error(error.message);
    return Array.from(
      new Set<string>(
        (data || []).map((p: { location: string | null }) => p.location || ''),
      ),
    ).filter(Boolean);
  }

  async getPropertiesByLocation(
    type: string,
    location: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
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

  // ============================================
  // iCal Feeds
  // ============================================

  async getICalFeeds(propertyId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('property_ical_feeds')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async insertICalFeed(
    propertyId: string,
    name: string,
    url: string,
  ): Promise<Record<string, unknown>> {
    const payload = [
      { property_id: propertyId, name, url },
    ] as unknown as ICalFeedInsert[];
    const { data, error } = await this.client
      .from('property_ical_feeds')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async syncICalFeed(feedId: string): Promise<unknown> {
    const res = await this.client.rpc('sync_ical_feed', { feed_id: feedId });
    if (res.error) throw res.error;
    return res.data;
  }

  async getICalFeedPropertyId(id: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('property_ical_feeds')
      .select('property_id')
      .eq('id', id)
      .single();
    return data?.property_id as string | undefined;
  }

  async removeICalFeed(id: string): Promise<void> {
    const { error } = await this.client
      .from('property_ical_feeds')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ============================================
  // Availability
  // ============================================

  async getPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('property_availability')
      .select('*, feed:property_ical_feeds(name)')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate);
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async deleteAvailability(propertyId: string, dates: string[]): Promise<void> {
    const { error } = await this.client
      .from('property_availability')
      .delete()
      .eq('property_id', propertyId)
      .in('date', dates);
    if (error) throw new Error(error.message);
  }

  async insertAvailability(entries: Record<string, unknown>[]): Promise<void> {
    const { error } = await this.client
      .from('property_availability')
      .insert(entries);
    if (error) throw new Error(error.message);
  }

  async syncPropertyCalendar(propertyId: string): Promise<unknown> {
    const res = await this.client.functions.invoke('sync-ical', {
      body: { propertyId },
    });
    if (res.error) {
      const msg =
        res.error instanceof Error ? res.error.message : String(res.error);
      throw new Error(msg);
    }
    return res.data;
  }

  async getUnavailableDates(
    propertyId: string,
    today: string,
  ): Promise<string[]> {
    const { data, error } = await this.client
      .from('property_availability')
      .select('date')
      .eq('property_id', propertyId)
      .gte('date', today)
      .neq('status', 'available');
    if (error) throw new Error(error.message);
    return (data || []).map((row: { date: string }) => row.date);
  }

  // ============================================
  // Reviews
  // ============================================

  async getReviews(
    propertyId: string,
    from: number,
    to: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    const { data, error, count } = await this.client
      .from('reviews')
      .select('*, user:profiles(full_name, avatar_url)', { count: 'exact' })
      .eq('property_id', propertyId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count };
  }

  async getReviewCount(propertyId: string): Promise<number> {
    const { count, error } = await this.client
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)
      .eq('is_hidden', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async getExistingReview(
    propertyId: string,
    userId: string,
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.client
      .from('reviews')
      .select('id')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      this.logger.error(
        'getExistingReview error:',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
    }
    return data;
  }

  async getBookingCountForReview(
    propertyId: string,
    userId: string,
  ): Promise<number | null> {
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

  async insertReview(review: Record<string, unknown>): Promise<void> {
    const payload = [review] as unknown as ReviewInsert[];
    const { error } = await this.client
      .from('reviews')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
  }

  async getReviewUserId(reviewId: string): Promise<{ user_id: string } | null> {
    const { data } = await this.client
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (!data || !data.user_id) return null;
    return { user_id: data.user_id };
  }

  async deleteReview(reviewId: string): Promise<void> {
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
  ): Promise<void> {
    let query = this.client
      .from('reviews')
      .update({ is_flagged: isFlagged, is_hidden: isHidden })
      .eq('id', reviewId);
    if (excludeUserId) query = query.neq('user_id', excludeUserId);
    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async getFlaggedReviews(
    from: number,
    to: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    const { data, error, count } = await this.client
      .from('reviews')
      .select('*, user:profiles(full_name, avatar_url), properties(title)', {
        count: 'exact',
      })
      .eq('is_flagged', true)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(error.message);
    return { data: data ?? [], count };
  }

  async bulkDeleteReviews(reviewIds: string[]): Promise<void> {
    const { error } = await this.client
      .from('reviews')
      .delete()
      .in('id', reviewIds);
    if (error) throw new Error(error.message);
  }

  // ============================================
  // Profiles & Auth queries
  // ============================================

  async getProfile(userId: string): Promise<Record<string, unknown> | null> {
    const { data } = await this.client
      .from('profiles')
      .select('full_name, avatar_url, email, phone, company_name, role')
      .eq('id', userId)
      .single();
    return data;
  }

  invokeEmailFunction(payload: Record<string, unknown>): void {
    this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err: unknown) => {
        this.logger.error(
          'Failed to invoke send-email function',
          err instanceof Error ? err.stack : undefined,
        );
      });
  }
}
