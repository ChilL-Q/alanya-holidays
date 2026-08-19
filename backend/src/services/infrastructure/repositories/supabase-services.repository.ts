import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import {
  IServicesRepository,
  ServiceOwnershipInfo,
} from '../../domain/repositories/services.repository.interface';
import { ServiceOfferingEntity } from '../../domain/entities/service-offering.entity';
import { ServiceOfferingMapper } from '../mappers/service-offering.mapper';

@Injectable()
export class SupabaseServicesRepository implements IServicesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  // ============================================
  // Domain Entity Methods
  // ============================================

  async findById(id: string): Promise<ServiceOfferingEntity | null> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
    let query = this.client.from('services').select('*');
    query = isUUID ? query.eq('id', id) : query.eq('service_ref', parseInt(id));

    const { data, error } = await query.single();
    if (error || !data) {
      if (!isUUID) {
        const { data: found } = await this.client
          .from('services')
          .select('*')
          .eq('service_ref', parseInt(id))
          .maybeSingle();
        if (found) return ServiceOfferingMapper.toDomain(found);
      }
      return null;
    }

    return ServiceOfferingMapper.toDomain(data);
  }

  async save(service: ServiceOfferingEntity): Promise<ServiceOfferingEntity> {
    const persistenceData = ServiceOfferingMapper.toPersistence(service);

    if (service.id) {
      const { error } = await this.client
        .from('services')
        .update(persistenceData)
        .eq('id', service.id);

      if (error) throw new Error(error.message);
      return service;
    }

    const { data, error } = await this.client
      .from('services')
      .insert([persistenceData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return ServiceOfferingMapper.toDomain(data);
  }

  // ============================================
  // Services Queries & Persistence
  // ============================================

  async insertService(
    serviceData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.client
      .from('services')
      .insert([serviceData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data ?? {};
  }

  async getServices(
    type?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
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
    return {
      data: data ?? [],
      count: count ?? 0,
    };
  }

  async getServicesByProvider(
    providerId: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceByIdOrRef(
    id: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );
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
    return { data: data, error };
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data, error } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('getUserRole error:', error);
    }
    return data?.role as string | undefined;
  }

  async getServiceOwnershipInfo(
    id: string,
  ): Promise<ServiceOwnershipInfo | null> {
    const { data, error } = await this.client
      .from('services')
      .select('provider_id, title, type')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('getServiceOwnershipInfo error:', error);
    }
    return data ? data : null;
  }

  async updateService(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client
      .from('services')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteService(id: string): Promise<void> {
    const { error } = await this.client.from('services').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getAdminServices(
    statusFilter?: string,
    typesFilter?: string[],
    page = 1,
    limit = 50,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
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
    return {
      data: data ?? [],
      count: count ?? 0,
    };
  }

  // ============================================
  // Catalog / Models
  // ============================================

  async getServiceBrands(type: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('service_models')
      .select('brand')
      .eq('type', type);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceModels(
    type: string,
    brand: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('service_models')
      .select('*')
      .eq('type', type)
      .eq('brand', brand);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
    const { data, error } = await this.client
      .from('service_models')
      .select('*')
      .eq('type', type)
      .eq('brand', brand)
      .eq('model', model)
      .single();
    return { data: data, error };
  }

  async updateServiceModel(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client
      .from('service_models')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getServicesByModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('services')
      .select('*, provider:profiles(full_name)')
      .eq('type', type)
      .contains('features', { brand, model });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // ============================================
  // Service Edits
  // ============================================

  async insertServiceEdit(editData: Record<string, unknown>): Promise<void> {
    const { error } = await this.client.from('service_edits').insert(editData);
    if (error) throw new Error(error.message);
  }

  async getPendingServiceEdits(): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*, service:services(title, provider:profiles(full_name))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceEditsByService(
    serviceId: string,
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getMyPendingEdits(userId: string): Promise<Record<string, unknown>[]> {
    const { data: services } = await this.client
      .from('services')
      .select('id')
      .eq('provider_id', userId);
    if (!services || services.length === 0) return [];

    const serviceIds = (services as Array<{ id: string }>).map((s) => s.id);
    const { data, error } = await this.client
      .from('service_edits')
      .select('service_id, status')
      .in('service_id', serviceIds)
      .eq('status', 'pending');
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getServiceEditById(
    editId: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }> {
    const { data, error } = await this.client
      .from('service_edits')
      .select('*')
      .eq('id', editId)
      .single();
    return { data: data, error };
  }

  async deleteServiceEdit(editId: string): Promise<void> {
    const { error } = await this.client
      .from('service_edits')
      .delete()
      .eq('id', editId);
    if (error) throw new Error(error.message);
  }

  async updateServiceEdit(
    editId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.client
      .from('service_edits')
      .update(updates)
      .eq('id', editId);
    if (error) throw new Error(error.message);
  }
}
