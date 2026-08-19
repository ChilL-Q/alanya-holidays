import {
  PropertyEntity,
  PropertyStatus,
} from '../../domain/entities/property.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

export interface PropertyPersistenceRow {
  id?: string;
  title?: string;
  type?: string;
  location?: string;
  price_per_night?: number | string;
  currency?: string;
  cleaning_fee?: number | string | null;
  min_stay_nights?: number | string;
  max_guests?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  beds?: number | string;
  host_id?: string;
  images?: string[] | null;
  amenities?: string[] | null;
  description?: string | null;
  status?: string;
  rejection_reason?: string | null;
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

export class PropertyMapper {
  /**
   * Converts a database row or persistence record into a rich PropertyEntity domain model.
   */
  static toDomain(
    row: PropertyPersistenceRow | Record<string, unknown> | null | undefined,
  ): PropertyEntity {
    if (!row || typeof row !== 'object') {
      throw new Error(
        'Cannot map invalid or empty database row to PropertyEntity',
      );
    }

    const rawPrice = row.price_per_night;
    const price =
      rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))
        ? Number(rawPrice)
        : 0;

    const currency =
      typeof row.currency === 'string' && row.currency.trim()
        ? row.currency.trim().toUpperCase()
        : 'EUR';
    const pricePerNight = new Money(price, currency);

    let cleaningFee: Money | undefined;
    if (
      row.cleaning_fee !== undefined &&
      row.cleaning_fee !== null &&
      !isNaN(Number(row.cleaning_fee))
    ) {
      cleaningFee = new Money(Number(row.cleaning_fee), currency);
    }

    const minStayNights = Number(row.min_stay_nights ?? 1);
    const maxGuests = Number(row.max_guests ?? 1);
    const bedrooms = Number(row.bedrooms ?? 0);
    const bathrooms = Number(row.bathrooms ?? 0);
    const beds = Number(row.beds ?? 0);

    const title = safeString(row.title) || 'Untitled Property';
    const type = safeString(row.type) || 'apartment';
    const location = safeString(row.location);
    const hostId = safeString(row.host_id) || 'host-unknown';
    const status = (row.status as PropertyStatus) || 'pending';
    const rejectionReason =
      typeof row.rejection_reason === 'string'
        ? row.rejection_reason
        : undefined;

    const images = Array.isArray(row.images) ? (row.images as string[]) : [];
    const amenities = Array.isArray(row.amenities)
      ? (row.amenities as string[])
      : [];
    const description =
      typeof row.description === 'string' ? row.description : undefined;

    const createdAt = row.created_at
      ? new Date(row.created_at as string | Date)
      : undefined;
    const updatedAt = row.updated_at
      ? new Date(row.updated_at as string | Date)
      : undefined;

    return PropertyEntity.restore({
      id: safeString(row.id) || 'prop-default',
      title,
      type,
      location,
      pricePerNight,
      cleaningFee,
      minStayNights: minStayNights >= 1 ? minStayNights : 1,
      maxGuests: maxGuests >= 1 ? maxGuests : 1,
      bedrooms: bedrooms >= 0 ? bedrooms : 0,
      bathrooms: bathrooms >= 0 ? bathrooms : 0,
      beds: beds >= 0 ? beds : 0,
      hostId,
      images,
      amenities,
      description,
      status,
      rejectionReason,
      createdAt,
      updatedAt,
    });
  }

  /**
   * Converts a rich PropertyEntity domain model into a database persistence format.
   */
  static toPersistence(entity: PropertyEntity): Record<string, unknown> {
    if (!entity || !(entity instanceof PropertyEntity)) {
      throw new Error('Cannot map non-PropertyEntity to persistence format');
    }

    const record: Record<string, unknown> = {
      title: entity.title,
      type: entity.type,
      location: entity.location,
      price_per_night: entity.pricePerNight.amount,
      currency: entity.pricePerNight.currency,
      cleaning_fee: entity.cleaningFee ? entity.cleaningFee.amount : null,
      min_stay_nights: entity.minStayNights,
      max_guests: entity.maxGuests,
      bedrooms: entity.bedrooms,
      bathrooms: entity.bathrooms,
      beds: entity.beds,
      host_id: entity.hostId,
      images: entity.images,
      amenities: entity.amenities,
      description: entity.description ?? null,
      status: entity.status,
      rejection_reason: entity.rejectionReason ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };

    if (entity.id) {
      record.id = entity.id;
    }

    return record;
  }
}
