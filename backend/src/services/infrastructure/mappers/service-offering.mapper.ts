import {
  ServiceOfferingEntity,
  ServiceOfferingStatus,
} from '../../domain/entities/service-offering.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

export interface ServiceOfferingPersistenceRow {
  id?: string;
  title?: string;
  type?: string;
  provider_id?: string;
  price?: number | string;
  currency?: string;
  price_unit?: string | null;
  capacity?: number | string | null;
  location?: string | null;
  description?: string | null;
  images?: string[] | null;
  features?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
  service_ref?: number | string | null;
  status?: string;
  rejection_reason?: string | null;
  rating?: number | string | null;
  review_count?: number | string | null;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
}

function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return fallback;
}

export class ServiceOfferingMapper {
  /**
   * Converts a database row or persistence record into a rich ServiceOfferingEntity domain model.
   */
  static toDomain(
    row:
      | ServiceOfferingPersistenceRow
      | Record<string, unknown>
      | null
      | undefined,
  ): ServiceOfferingEntity {
    if (!row || typeof row !== 'object') {
      throw new Error(
        'Cannot map invalid or empty database row to ServiceOfferingEntity',
      );
    }

    const rawPrice = row.price;
    const priceAmount =
      rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))
        ? Number(rawPrice)
        : 0;

    const currency =
      typeof row.currency === 'string' && row.currency.trim()
        ? row.currency.trim().toUpperCase()
        : 'EUR';

    const price = new Money(priceAmount, currency);

    const title = safeString(row.title) || 'Untitled Service';
    const type = safeString(row.type) || 'service';
    const providerId = safeString(row.provider_id) || 'provider-unknown';
    const priceUnit =
      typeof row.price_unit === 'string' ? row.price_unit : undefined;

    let capacity: number | undefined;
    if (
      row.capacity !== undefined &&
      row.capacity !== null &&
      !isNaN(Number(row.capacity))
    ) {
      const capNum = Number(row.capacity);
      capacity = capNum >= 0 ? capNum : undefined;
    }

    const location =
      typeof row.location === 'string' ? row.location : undefined;
    const description =
      typeof row.description === 'string' ? row.description : undefined;

    const images = Array.isArray(row.images) ? (row.images as string[]) : [];
    const features =
      row.features &&
      typeof row.features === 'object' &&
      !Array.isArray(row.features)
        ? (row.features as Record<string, unknown>)
        : {};
    const details =
      row.details &&
      typeof row.details === 'object' &&
      !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : {};

    const serviceRef =
      row.service_ref !== undefined &&
      row.service_ref !== null &&
      !isNaN(Number(row.service_ref))
        ? Number(row.service_ref)
        : undefined;

    const status = (row.status as ServiceOfferingStatus) || 'pending';
    const rejectionReason =
      typeof row.rejection_reason === 'string'
        ? row.rejection_reason
        : undefined;

    const rating =
      row.rating !== undefined &&
      row.rating !== null &&
      !isNaN(Number(row.rating))
        ? Number(row.rating)
        : undefined;

    const reviewCount =
      row.review_count !== undefined &&
      row.review_count !== null &&
      !isNaN(Number(row.review_count))
        ? Number(row.review_count)
        : undefined;

    const createdAt = row.created_at
      ? new Date(row.created_at as string | Date)
      : undefined;
    const updatedAt = row.updated_at
      ? new Date(row.updated_at as string | Date)
      : undefined;

    return ServiceOfferingEntity.restore({
      id: safeString(row.id) || 'srv-default',
      title,
      type,
      providerId,
      price,
      priceUnit,
      capacity,
      location,
      description,
      images,
      features,
      details,
      serviceRef,
      status,
      rejectionReason,
      rating,
      reviewCount,
      createdAt,
      updatedAt,
    });
  }

  /**
   * Converts a rich ServiceOfferingEntity domain model into a database persistence format.
   */
  static toPersistence(entity: ServiceOfferingEntity): Record<string, unknown> {
    if (!entity || !(entity instanceof ServiceOfferingEntity)) {
      throw new Error(
        'Cannot map non-ServiceOfferingEntity to persistence format',
      );
    }

    const record: Record<string, unknown> = {
      title: entity.title,
      type: entity.type,
      provider_id: entity.providerId,
      price: entity.price.amount,
      currency: entity.price.currency,
      price_unit: entity.priceUnit ?? null,
      capacity: entity.capacity ?? null,
      location: entity.location ?? null,
      description: entity.description ?? null,
      images: entity.images,
      features: entity.features,
      details: entity.details,
      status: entity.status,
      rejection_reason: entity.rejectionReason ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };

    if (entity.id) {
      record.id = entity.id;
    }

    if (entity.serviceRef !== undefined) {
      record.service_ref = entity.serviceRef;
    }

    if (entity.rating !== undefined) {
      record.rating = entity.rating;
    }

    if (entity.reviewCount !== undefined) {
      record.review_count = entity.reviewCount;
    }

    return record;
  }
}
