import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PropertiesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPropertiesByIds(ids: string[]) {
    if (!ids || !ids.length) return [];
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url)')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return data;
  }

  async createProperty(data: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: property, error } = await supabase
      .from('properties')
      .insert([{ ...data, host_id: userId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return property;
  }

  async getProperties(queryOptions: any) {
    const { page = 1, limit = 20, filters, location, allowedIds, sort = 'newest' } = queryOptions;
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('properties')
      .select('*, host:profiles(full_name, avatar_url), reviews(count)', { count: 'exact' })
      .eq('status', 'approved');

    if (allowedIds && allowedIds.length > 0) query = query.in('id', allowedIds);

    if (location && location !== 'all') {
      const safeLocation = location.replace(/[%_,.()"']/g, '').trim().slice(0, 100);
      if (safeLocation) {
        query = query.or(`location.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`);
      }
    }

    if (filters) {
      if (filters.priceRange) {
        query = query.gte('price_per_night', filters.priceRange[0]);
        if (filters.priceRange[1] > 0) query = query.lte('price_per_night', filters.priceRange[1]);
      }
      if (filters.types?.length > 0) {
        query = query.in('type', filters.types.map((t: string) => t.toLowerCase()));
      }
      if (filters.minGuests > 1) query = query.gte('max_guests', filters.minGuests);
      if (filters.minBedrooms > 0) query = query.gte('bedrooms', filters.minBedrooms);
      if (filters.minBeds > 1) query = query.gte('beds', filters.minBeds);
      if (filters.minBathrooms > 1) query = query.gte('bathrooms', filters.minBathrooms);
      if (filters.hasPhotos) query = query.not('images', 'is', null);
    }

    switch (sort) {
      case 'price_asc': query = query.order('price_per_night', { ascending: true }); break;
      case 'price_desc': query = query.order('price_per_night', { ascending: false }); break;
      case 'rating': query = query.order('rating', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false }); break;
    }
    query = query.order('id', { ascending: true });

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async getProperty(id: string) {
    const supabase = this.supabaseService.getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('properties')
        .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
        .eq('id', id)
        .single();
      if (error) throw new NotFoundException('Property not found');
      return data;
    } else {
      const refId = parseInt(id);
      const { data, error } = await supabase.rpc('get_property_by_ref_id', { ref_id_param: refId });
      if (error || !data || data.length === 0) throw new NotFoundException('Property not found');
      
      const prop = data[0];
      if (prop.host_id) {
        const { data: hostData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, email, phone, company_name')
          .eq('id', prop.host_id)
          .single();
        if (hostData) prop.host = hostData;
      }
      return prop;
    }
  }

  async getAvailableProperties(checkIn: string, checkOut: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.rpc('get_available_properties', {
      check_in_date: checkIn,
      check_out_date: checkOut
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getPropertiesByHost(hostId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getAdminProperties(statusFilter: string = 'all', page = 1, limit = 50) {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('properties').select('*', { count: 'exact' });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data, count };
  }

  async updateProperty(id: string, updates: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Check authorization
    const { data: existingProp } = await supabase.from('properties').select('host_id').eq('id', id).single();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    
    if (!existingProp || (existingProp.host_id !== userId && profile?.role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    const { status, ical_token, ical_url, last_synced_at, ...safeUpdates } = updates;
    const { error } = await supabase.from('properties').update(safeUpdates).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async updatePropertyStatus(id: string, status: string, reason: string | undefined, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    const updates: any = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    const { error } = await supabase.from('properties').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async deleteProperty(id: string, reason: string | undefined, userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data: property } = await supabase.from('properties').select('host_id, title').eq('id', id).single();
    if (!property) throw new NotFoundException('Property not found');
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (property.host_id !== userId && profile?.role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    // Safely delete relations first (transaction-like)
    await supabase.from('reviews').delete().eq('property_id', id);
    await supabase.from('property_availability').delete().eq('property_id', id);
    await supabase.from('property_ical_feeds').delete().eq('property_id', id);
    await supabase.from('favorites').delete().eq('item_id', id);

    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
    } catch {
      // Fallback to soft delete
      await supabase.from('properties')
        .update({ status: 'rejected', title: `${property.title} (Deleted)`, location: 'Archived' })
        .eq('id', id);
    }
    return { success: true };
  }
}
