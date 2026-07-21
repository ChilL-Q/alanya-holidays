import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ServicesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async insertService(serviceData: any) {
    const { data, error } = await this.client
      .from('services')
      .insert([serviceData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getServices(type?: string, page = 1, limit = 20) {
    let query = this.client
      .from('services')
      .select('*, provider:profiles(full_name, company_name)', {
        count: 'exact',
      })
      .eq('status', 'approved');
    if (type && type !== 'all') query = query.eq('type', type);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: data || [], count: count || 0 };
  }

  async getServicesByProvider(providerId: string) {
    const { data, error } = await this.client
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceByIdOrRef(id: string) {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = this.client.from('services').select('*');
    query = isUUID ? query.eq('id', id) : query.eq('service_ref', parseInt(id));

    const { data, error } = await query.single();
    
    if ((error || !data) && !isUUID) {
      const { data: found } = await this.client
        .from('services')
        .select('*')
        .eq('service_ref', parseInt(id))
        .maybeSingle();
      if (found) return { data: found, error: null };
    }
    return { data, error };
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  async getServiceOwnershipInfo(id: string) {
    const { data } = await this.client
      .from('services')
      .select('provider_id, title, type')
      .eq('id', id)
      .single();
    return data;
  }

  async updateService(id: string, updates: any) {
    const { error } = await this.client
      .from('services')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteService(id: string) {
    const { error } = await this.client.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getAdminServices(statusFilter?: string, typesFilter?: string[], page = 1, limit = 50) {
    let query = this.client
      .from('services')
      .select('*, provider:profiles(full_name)', { count: 'exact' });

    if (statusFilter && statusFilter !== 'all')
      query = query.eq('status', statusFilter);
    if (typesFilter && typesFilter.length > 0)
      query = query.in('type', typesFilter);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);
    if (error) throw new Error(error.message);
    return { data: data || [], count: count || 0 };
  }

  async getServiceBrands(type: string) {
    const { data, error } = await this.client
      .from('service_models')
      .select('brand')
      .eq('type', type);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceModels(type: string, brand: string) {
    const { data, error } = await this.client
      .from('service_models')
      .select('*')
      .eq('type', type)
      .eq('brand', brand);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceModel(type: string, brand: string, model: string) {
    const { data, error } = await this.client
      .from('service_models')
      .select('*')
      .eq('type', type)
      .eq('brand', brand)
      .eq('model', model)
      .single();
    return { data, error };
  }

  async updateServiceModel(id: string, updates: any) {
    const { error } = await this.client
      .from('service_models')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getServicesByModel(type: string, brand: string, model: string) {
    const { data, error } = await this.client
      .from('services')
      .select('*, provider:profiles(full_name)')
      .eq('type', type)
      .contains('features', { brand, model });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async insertServiceEdit(editData: any) {
    const { error } = await this.client.from('service_edits').insert(editData);
    if (error) throw new Error(error.message);
  }

  async getPendingServiceEdits() {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*, service:services(title, provider:profiles(full_name))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceEditsByService(serviceId: string) {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getMyPendingEdits(userId: string) {
    const { data: services } = await this.client
      .from('services')
      .select('id')
      .eq('provider_id', userId);
    if (!services || services.length === 0) return [];

    const { data, error } = await this.client
      .from('service_edits')
      .select('service_id, status')
      .in(
        'service_id',
        services.map((s: any) => s.id),
      )
      .eq('status', 'pending');
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceEditById(editId: string) {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*')
      .eq('id', editId)
      .single();
    return { data, error };
  }

  async deleteServiceEdit(editId: string) {
    const { error } = await this.client.from('service_edits').delete().eq('id', editId);
    if (error) throw new Error(error.message);
  }

  async updateServiceEdit(editId: string, updates: any) {
    const { error } = await this.client
      .from('service_edits')
      .update(updates)
      .eq('id', editId);
    if (error) throw new Error(error.message);
  }
}
