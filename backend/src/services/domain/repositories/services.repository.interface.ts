import { ServiceOfferingEntity } from '../entities/service-offering.entity';

export const SERVICES_REPOSITORY = Symbol('IServicesRepository');

export interface ServiceOwnershipInfo {
  provider_id: string;
  title: string;
  type: string;
}

export interface ServiceEditRecord {
  id: string;
  service_id: string;
  changed_data: Record<string, unknown>;
  status: string;
  rejection_reason?: string | null;
  created_at?: string | Date;
  service?: {
    title: string;
    provider?: {
      full_name: string;
    };
  };
}

export interface ServiceModelRecord {
  id?: string;
  type: string;
  brand: string;
  model: string;
  [key: string]: unknown;
}

/**
 * Domain Repository Interface for Services & Offerings.
 * Zero external framework dependencies.
 */
export interface IServicesRepository {
  // Domain Entity operations
  findById(id: string): Promise<ServiceOfferingEntity | null>;
  save(service: ServiceOfferingEntity): Promise<ServiceOfferingEntity>;

  // Services Queries & Persistence
  insertService(
    serviceData: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  getServices(
    type?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number }>;
  getServicesByProvider(providerId: string): Promise<Record<string, unknown>[]>;
  getServiceByIdOrRef(
    id: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  getUserRole(userId: string): Promise<string | undefined>;
  getServiceOwnershipInfo(id: string): Promise<ServiceOwnershipInfo | null>;
  updateService(id: string, updates: Record<string, unknown>): Promise<void>;
  deleteService(id: string): Promise<void>;
  getAdminServices(
    statusFilter?: string,
    typesFilter?: string[],
    page?: number,
    limit?: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number }>;

  // Catalog / Models
  getServiceBrands(type: string): Promise<Record<string, unknown>[]>;
  getServiceModels(
    type: string,
    brand: string,
  ): Promise<Record<string, unknown>[]>;
  getServiceModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  updateServiceModel(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<void>;
  getServicesByModel(
    type: string,
    brand: string,
    model: string,
  ): Promise<Record<string, unknown>[]>;

  // Service Edits
  insertServiceEdit(editData: Record<string, unknown>): Promise<void>;
  getPendingServiceEdits(): Promise<Record<string, unknown>[]>;
  getServiceEditsByService(
    serviceId: string,
  ): Promise<Record<string, unknown>[]>;
  getMyPendingEdits(userId: string): Promise<Record<string, unknown>[]>;
  getServiceEditById(
    editId: string,
  ): Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  deleteServiceEdit(editId: string): Promise<void>;
  updateServiceEdit(
    editId: string,
    updates: Record<string, unknown>,
  ): Promise<void>;
}
