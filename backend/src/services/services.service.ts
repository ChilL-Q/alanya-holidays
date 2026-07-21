import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ServicesRepository } from './services.repository';

const IMMUTABLE_SERVICE_FIELDS = new Set([
  'id',
  'provider_id',
  'status',
  'created_at',
  'updated_at',
]);

@Injectable()
export class ServicesService {
  constructor(private readonly servicesRepository: ServicesRepository) {}

  // ============================================
  // Services CRUD (Existing)
  // ============================================

  async createService(data: any, userId: string) {
    const insertData = { ...data, provider_id: userId };
    const service = await this.servicesRepository.insertService(insertData);
    return service;
  }

  async getServices(type?: string, page = 1, limit = 20) {
    const { data, count } = await this.servicesRepository.getServices(
      type,
      page,
      limit,
    );

    const mappedData =
      data?.map((s) => ({
        ...s,
        service_ref: s.service_ref || parseInt(s.id.slice(0, 8), 16) % 10000,
      })) || [];
    return { data: mappedData, count };
  }

  async getServicesByProvider(providerId: string) {
    return this.servicesRepository.getServicesByProvider(providerId);
  }

  async getService(id: string) {
    const { data, error } =
      await this.servicesRepository.getServiceByIdOrRef(id);
    if (error || !data) throw new NotFoundException('Service not found');
    return data;
  }

  async updateService(id: string, updates: any, userId: string) {
    const existingService =
      await this.servicesRepository.getServiceOwnershipInfo(id);
    const role = await this.servicesRepository.getUserRole(userId);

    if (
      !existingService ||
      (existingService.provider_id !== userId && role !== 'admin')
    ) {
      throw new UnauthorizedException('Not authorized');
    }

    const {
      status: _status,
      provider_id: _providerId,
      id: _id,
      created_at: _createdAt,
      ...safeUpdates
    } = updates;

    await this.servicesRepository.updateService(id, safeUpdates);
    return { success: true };
  }

  async deleteService(id: string, reason: string | undefined, userId: string) {
    const service = await this.servicesRepository.getServiceOwnershipInfo(id);
    if (!service) throw new NotFoundException('Service not found');

    const role = await this.servicesRepository.getUserRole(userId);
    if (service.provider_id !== userId && role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    await this.servicesRepository.deleteService(id);
    return { success: true };
  }

  async updateServiceStatus(
    id: string,
    status: string,
    reason: string | undefined,
    userId: string,
  ) {
    const role = await this.servicesRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException(
        'Not authorized: only admins can change service status',
      );

    const updates: any = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    await this.servicesRepository.updateService(id, updates);
    return { success: true };
  }

  async getAdminServices(
    statusFilter: string | undefined,
    typesFilter: string[] | undefined,
    page = 1,
    limit = 50,
  ) {
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

  getServiceTypes() {
    return ['car', 'bike', 'tour', 'transfer', 'visa', 'esim'];
  }

  async getServiceBrands(type: string) {
    const data = await this.servicesRepository.getServiceBrands(type);
    return [...new Set(data.map((item: any) => item.brand))];
  }

  async getServiceModels(type: string, brand: string) {
    return this.servicesRepository.getServiceModels(type, brand);
  }

  async getServiceModel(type: string, brand: string, model: string) {
    const { data, error } = await this.servicesRepository.getServiceModel(
      type,
      brand,
      model,
    );
    if (error || !data) throw new NotFoundException('Service model not found');
    return data;
  }

  async updateServiceModel(id: string, updates: any, userId: string) {
    const role = await this.servicesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.servicesRepository.updateServiceModel(id, updates);
    return { success: true };
  }

  async getServicesByModel(type: string, brand: string, model: string) {
    return this.servicesRepository.getServicesByModel(type, brand, model);
  }

  // ============================================
  // Services Edits
  // ============================================

  async requestServiceUpdate(serviceId: string, changes: any, _userId: string) {
    await this.servicesRepository.insertServiceEdit({
      service_id: serviceId,
      changed_data: changes,
      status: 'pending',
    });
    return { success: true };
  }

  async getPendingServiceEdits() {
    return this.servicesRepository.getPendingServiceEdits();
  }

  async getServiceEditsByService(serviceId: string) {
    return this.servicesRepository.getServiceEditsByService(serviceId);
  }

  async getMyPendingEdits(userId: string) {
    return this.servicesRepository.getMyPendingEdits(userId);
  }

  async getServiceEdit(editId: string) {
    const { data, error } =
      await this.servicesRepository.getServiceEditById(editId);
    if (error || !data) throw new NotFoundException('Service edit not found');
    return data;
  }

  async deleteServiceEdit(editId: string, _userId: string) {
    await this.servicesRepository.deleteServiceEdit(editId);
    return { success: true };
  }

  async approveServiceEdit(editId: string, userId: string) {
    const role = await this.servicesRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException('Admin access required');

    const { data: edit, error: fetchError } =
      await this.servicesRepository.getServiceEditById(editId);
    if (fetchError || !edit) throw new NotFoundException('Edit not found');

    const safeChanges: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(edit.changed_data)) {
      if (!IMMUTABLE_SERVICE_FIELDS.has(key)) safeChanges[key] = value;
    }

    await this.servicesRepository.updateService(edit.service_id, safeChanges);
    await this.servicesRepository.deleteServiceEdit(editId);

    const service = await this.servicesRepository.getServiceOwnershipInfo(
      edit.service_id,
    );
    if (service) {
      // In a real app we'd use a notifications service here. Skipping for backend simplicity.
    }
    return { success: true };
  }

  async rejectServiceEdit(
    editId: string,
    reason: string | undefined,
    userId: string,
  ) {
    const role = await this.servicesRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException('Admin access required');

    await this.servicesRepository.updateServiceEdit(editId, {
      status: 'rejected',
      rejection_reason: reason,
    });
    return { success: true };
  }
}
