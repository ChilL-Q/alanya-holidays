import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createService(data: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const insertData = { ...data, provider_id: userId };

    const { data: service, error } = await supabase
      .from('services')
      .insert([insertData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return service;
  }

  async getServices(type?: string, page = 1, limit = 20) {
    const supabase = this.supabaseService.getClient();
    let query = supabase
      .from('services')
      .select('*, provider:profiles(full_name, company_name)', { count: 'exact' })
      .eq('status', 'approved');

    if (type && type !== 'all') query = query.eq('type', type);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);

    const mappedData = data?.map(s => ({
      ...s,
      service_ref: s.service_ref || parseInt(s.id.slice(0, 8), 16) % 10000
    })) || [];

    return { data: mappedData, count };
  }

  async getServicesByProvider(providerId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getService(id: string) {
    const supabase = this.supabaseService.getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('services').select('*');
    query = isUUID ? query.eq('id', id) : query.eq('service_ref', parseInt(id));

    const { data, error } = await query.single();

    if ((error || !data) && !isUUID) {
      const { data: found } = await supabase
        .from('services')
        .select('*')
        .eq('service_ref', parseInt(id))
        .maybeSingle();
      if (found) return found;
    }

    if (error) throw new NotFoundException('Service not found');
    return data;
  }

  async updateService(id: string, updates: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: existingService } = await supabase
      .from('services')
      .select('provider_id, title, type')
      .eq('id', id)
      .single();

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (!existingService || (existingService.provider_id !== userId && profile?.role !== 'admin')) {
      throw new UnauthorizedException('Not authorized');
    }

    const { status, provider_id, id: _id, created_at, ...safeUpdates } = updates;
    const { error } = await supabase.from('services').update(safeUpdates).eq('id', id);
    if (error) throw new Error(error.message);

    return { success: true };
  }

  async deleteService(id: string, reason: string | undefined, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('provider_id, title, type')
      .eq('id', id)
      .single();

    if (fetchError || !service) throw new NotFoundException('Service not found');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (service.provider_id !== userId && profile?.role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);

    return { success: true };
  }

  async updateServiceStatus(id: string, status: string, reason: string | undefined, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    
    if (profile?.role !== 'admin') {
      throw new UnauthorizedException('Not authorized: only admins can change service status');
    }

    const updates: any = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    const { error } = await supabase.from('services').update(updates).eq('id', id);
    if (error) throw new Error(error.message);

    return { success: true };
  }

  async getAdminServices(statusFilter: string | undefined, typesFilter: string[] | undefined, page = 1, limit = 50) {
    const supabase = this.supabaseService.getClient();
    let query = supabase.from('services').select('*, provider:profiles(full_name)', { count: 'exact' });
    
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typesFilter && typesFilter.length > 0) query = query.in('type', typesFilter);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { data, count };
  }
}
