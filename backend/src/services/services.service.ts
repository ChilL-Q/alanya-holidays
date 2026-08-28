import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IServicesRepository,
  SERVICES_REPOSITORY,
} from './domain/repositories/services.repository.interface';
import { RedisService } from '../common/redis/redis.service';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { ServiceListResponse } from './types/services.types';

const IMMUTABLE_SERVICE_FIELDS = new Set([
  'id',
  'provider_id',
  'status',
  'created_at',
  'updated_at',
]);

@Injectable()
export class ServicesService {
  constructor(
    @Inject(SERVICES_REPOSITORY)
    private readonly servicesRepository: IServicesRepository,
    private readonly redisService: RedisService,
    private readonly userRolesRepo: UserRolesRepository,
  ) {}

  // ============================================
  // Services CRUD
  // ============================================

  async createService(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const insertData: Record<string, unknown> = {
      ...data,
      provider_id: userId,
    };
    const service = await this.servicesRepository.insertService(insertData);
    await this.redisService.delByPattern('services:*');
    return service;
  }

  // ============================================
  // Service Drafts
  // ============================================

  async saveServiceDraft(
    data: Record<string, unknown> & { draftId?: string },
    userId: string,
  ): Promise<{ id: string }> {
    const { draftId, ...raw } = data;
    const safeData: Record<string, unknown> = { ...raw };
    for (const field of IMMUTABLE_SERVICE_FIELDS) {
      delete safeData[field];
    }
    if (typeof safeData.title !== 'string' || safeData.title.trim() === '') {
      safeData.title = 'Untitled Draft';
    }

    let serviceId: string;
    if (draftId) {
      const owner =
        await this.servicesRepository.getServiceOwnershipInfo(draftId);
      if (!owner || owner.provider_id !== userId) {
        throw new UnauthorizedException('Not authorized');
      }
      await this.servicesRepository.updateService(draftId, {
        ...safeData,
        status: 'draft',
      });
      serviceId = draftId;
    } else {
      const inserted = await this.servicesRepository.insertService({
        ...safeData,
        provider_id: userId,
        status: 'draft',
      });
      serviceId =
        typeof inserted.id === 'string' ? inserted.id : String(inserted.id);
    }

    await this.redisService.delByPattern('services:*');
    return { id: serviceId };
  }

  async publishServiceDraft(
    id: string,
    updates: Record<string, unknown>,
    userId: string,
  ): Promise<{ success: boolean }> {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new BadRequestException('Invalid service id');
    }

    const owner = await this.servicesRepository.getServiceOwnershipInfo(id);
    if (!owner || owner.provider_id !== userId) {
      throw new UnauthorizedException('Not authorized');
    }

    const title = typeof updates.title === 'string' ? updates.title.trim() : '';
    if (!title || title.length < 3) {
      throw new BadRequestException(
        'Title is required (minimum 3 characters) to publish',
      );
    }
    if (typeof updates.type !== 'string' || updates.type.trim() === '') {
      throw new BadRequestException('Service type is required to publish');
    }

    const safeUpdates: Record<string, unknown> = { ...updates };
    for (const field of IMMUTABLE_SERVICE_FIELDS) {
      delete safeUpdates[field];
    }
    safeUpdates.status = 'pending';

    await this.servicesRepository.updateService(id, safeUpdates);
    await this.redisService.delByPattern('services:*');
    return { success: true };
  }

  async getServices(
    type?: string,
    page = 1,
    limit = 20,
  ): Promise<ServiceListResponse> {
    const cacheKey = `services:list:${type || 'all'}:${page}:${limit}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      async () => {
        const { data, count } = await this.servicesRepository.getServices(
          type,
          page,
          limit,
        );

        const mappedData =
          data?.map((s) => {
            const idStr =
              typeof s.id === 'string'
                ? s.id
                : typeof s.id === 'number'
                  ? String(s.id)
                  : '';
            return {
              ...s,
              service_ref:
                s.service_ref || parseInt(idStr.slice(0, 8), 16) % 10000,
            };
          }) || [];
        const response: ServiceListResponse = { data: mappedData, count };
        return response;
      },
      { ttlFreshSeconds: 600 },
    );
  }

  async getServicesByProvider(
    providerId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesRepository.getServicesByProvider(providerId);
  }

  async getService(id: string): Promise<Record<string, unknown>> {
    const cacheKey = `services:item:${id}`;
    return this.redisService.getOrFetchSWR(
      cacheKey,
      async () => {
        const { data, error } =
          await this.servicesRepository.getServiceByIdOrRef(id);
        if (error || !data) throw new NotFoundException('Service not found');
        return data;
      },
      { ttlFreshSeconds: 600 },
    );
  }

  async updateService(
    id: string,
    updates: Record<string, unknown>,
    userId: string,
  ): Promise<{ success: boolean }> {
    const existingService =
      await this.servicesRepository.getServiceOwnershipInfo(id);
    const role = await this.userRolesRepo.getRole(userId);

    if (
      !existingService ||
      (existingService.provider_id !== userId && role !== 'admin')
    ) {
      throw new UnauthorizedException('Not authorized');
    }

    const safeUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!IMMUTABLE_SERVICE_FIELDS.has(key)) {
        safeUpdates[key] = value;
      }
    }

    await this.servicesRepository.updateService(id, safeUpdates);
    await this.redisService.delByPattern('services:*');
    return { success: true };
  }

  async deleteService(
    id: string,
    _reason: string | undefined,
    userId: string,
  ): Promise<{ success: boolean }> {
    const service = await this.servicesRepository.getServiceOwnershipInfo(id);
    if (!service) throw new NotFoundException('Service not found');

    const role = await this.userRolesRepo.getRole(userId);
    if (service.provider_id !== userId && role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    await this.servicesRepository.deleteService(id);
    await this.redisService.delByPattern('services:*');
    return { success: true };
  }

  async updateServiceStatus(
    id: string,
    status: string,
    reason?: string,
    _userId?: string,
  ): Promise<{ success: boolean }> {
    const updates: Record<string, unknown> = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    await this.servicesRepository.updateService(id, updates);
    await this.redisService.delByPattern('services:*');
    return { success: true };
  }

  async getAdminServices(
    statusFilter: string | undefined,
    typesFilter: string[] | undefined,
    page = 1,
    limit = 50,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    return this.servicesRepository.getAdminServices(
      statusFilter,
      typesFilter,
      page,
      limit,
    );
  }

  // ============================================
  // Services Catalog
  // ============================================

  getServiceTypes(): string[] {
    return ['car', 'bike', 'tour', 'transfer', 'visa', 'esim'];
  }

  async getServiceBrands(type: string): Promise<string[]> {
    const data = await this.servicesRepository.getServiceBrands(type);
    return [
      ...new Set(
        data
          .map((item) =>
            typeof item.brand === 'string'
              ? item.brand
              : typeof item.brand === 'number'
                ? String(item.brand)
                : '',
          )
          .filter((b) => b.length > 0),
      ),
    ];
  }

  async getServiceModels(
    type: string,
    brand: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesRepository.getServiceModels(type, brand);
  }

  async getServiceModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.servicesRepository.getServiceModel(
      type,
      brand,
      model,
    );
    if (error || !data) throw new NotFoundException('Service model not found');
    return data;
  }

  async updateServiceModel(
    id: string,
    updates: Record<string, unknown>,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.servicesRepository.updateServiceModel(id, updates);
    return { success: true };
  }

  async getServicesByModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<Record<string, unknown>[]> {
    return this.servicesRepository.getServicesByModel(type, brand, model);
  }

  // ============================================
  // Services Edits
  // ============================================

  async requestServiceUpdate(
    serviceId: string,
    changes: Record<string, unknown>,
    userId: string,
  ): Promise<{ success: boolean }> {
    const service =
      await this.servicesRepository.getServiceOwnershipInfo(serviceId);
    if (!service) throw new NotFoundException('Service not found');

    const role = await this.userRolesRepo.getRole(userId);
    if (service.provider_id !== userId && role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    await this.servicesRepository.insertServiceEdit({
      service_id: serviceId,
      changed_data: changes,
      status: 'pending',
    });
    return { success: true };
  }

  async getPendingServiceEdits(): Promise<Record<string, unknown>[]> {
    return this.servicesRepository.getPendingServiceEdits();
  }

  async getServiceEditsByService(
    serviceId: string,
    userId: string,
  ): Promise<Record<string, unknown>[]> {
    await this.assertCanReadServiceEdits(serviceId, userId);
    return this.servicesRepository.getServiceEditsByService(serviceId);
  }

  async getMyPendingEdits(userId: string): Promise<Record<string, unknown>[]> {
    return this.servicesRepository.getMyPendingEdits(userId);
  }

  async getServiceEdit(
    editId: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const { data, error } =
      await this.servicesRepository.getServiceEditById(editId);
    if (error || !data) throw new NotFoundException('Service edit not found');

    const serviceId =
      typeof data.service_id === 'string' ? data.service_id : undefined;
    if (!serviceId) throw new ForbiddenException('Access denied');

    await this.assertCanReadServiceEdits(serviceId, userId);
    return data;
  }

  private async assertCanReadServiceEdits(serviceId: string, userId: string) {
    const ownership =
      await this.servicesRepository.getServiceOwnershipInfo(serviceId);
    if (!ownership) throw new ForbiddenException('Access denied');

    const role = await this.userRolesRepo.getRole(userId);
    if (ownership.provider_id !== userId && role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
  }

  async deleteServiceEdit(
    editId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    await this.servicesRepository.deleteServiceEdit(editId);
    return { success: true };
  }

  async approveServiceEdit(
    editId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    const { data: edit, error: fetchError } =
      await this.servicesRepository.getServiceEditById(editId);
    if (fetchError || !edit) throw new NotFoundException('Edit not found');

    const changedData =
      edit.changed_data && typeof edit.changed_data === 'object'
        ? (edit.changed_data as Record<string, unknown>)
        : {};

    const safeChanges: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(changedData)) {
      if (!IMMUTABLE_SERVICE_FIELDS.has(key)) safeChanges[key] = value;
    }

    const serviceId =
      typeof edit.service_id === 'string'
        ? edit.service_id
        : typeof edit.service_id === 'number'
          ? String(edit.service_id)
          : '';
    await this.servicesRepository.updateService(serviceId, safeChanges);
    await this.servicesRepository.deleteServiceEdit(editId);
    await this.redisService.delByPattern('services:*');

    return { success: true };
  }

  async rejectServiceEdit(
    editId: string,
    reason: string | undefined,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    await this.servicesRepository.updateServiceEdit(editId, {
      status: 'rejected',
      rejection_reason: reason,
    });
    return { success: true };
  }
}
