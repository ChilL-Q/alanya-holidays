import {
  BookingEntity,
  BookingItemType,
  BookingStatus,
  Money,
  StayPeriod,
} from '../domain';

export interface BookingPersistenceRow {
  id?: string;
  item_id?: string;
  property_id?: string;
  service_id?: string;
  item_type?: string;
  user_id?: string;
  guest_id?: string;
  check_in?: string;
  check_out?: string;
  total_price?: number | string;
  currency?: string;
  status?: string;
  guests?: number | string;
  guests_count?: number | string;
  message?: string | null;
  payment_method?: string | null;
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

export class BookingMapper {
  /**
   * Converts a database row or persistence record into a rich BookingEntity domain model.
   */
  static toDomain(
    row: BookingPersistenceRow | Record<string, unknown> | null | undefined,
  ): BookingEntity {
    if (!row || typeof row !== 'object') {
      throw new Error(
        'Cannot map invalid or empty database row to BookingEntity',
      );
    }

    const checkIn = safeString(row.check_in) || '1970-01-01';
    const checkOut = safeString(row.check_out) || '1970-01-02';

    const stayPeriod = new StayPeriod(checkIn, checkOut);

    const rawPrice = row.total_price;
    const price =
      rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice))
        ? Number(rawPrice)
        : rawPrice === undefined
          ? 0
          : Number(rawPrice);

    const currency =
      typeof row.currency === 'string' && row.currency.trim()
        ? row.currency.trim().toUpperCase()
        : 'EUR';
    const totalPrice = new Money(price, currency);

    const itemId =
      safeString(row.item_id) ||
      safeString(row.property_id) ||
      safeString(row.service_id) ||
      'item-default';
    const itemType: BookingItemType =
      row.item_type === 'service' ? 'service' : 'property';
    const guestId =
      safeString(row.user_id) || safeString(row.guest_id) || 'guest-default';
    const status = (row.status as BookingStatus) || 'pending';
    const guestsCount = Number(row.guests ?? row.guests_count ?? 1);
    const message = typeof row.message === 'string' ? row.message : undefined;
    const paymentMethod =
      typeof row.payment_method === 'string' ? row.payment_method : undefined;
    const createdAt = row.created_at
      ? new Date(row.created_at as string | Date)
      : undefined;
    const updatedAt = row.updated_at
      ? new Date(row.updated_at as string | Date)
      : undefined;

    return BookingEntity.restore({
      id: safeString(row.id) || 'booking-default',
      itemId,
      itemType,
      guestId,
      stayPeriod,
      totalPrice,
      status,
      guestsCount,
      message,
      paymentMethod,
      createdAt,
      updatedAt,
    });
  }

  /**
   * Converts a rich BookingEntity domain model into a database persistence format.
   */
  static toPersistence(entity: BookingEntity): Record<string, unknown> {
    if (!entity || !(entity instanceof BookingEntity)) {
      throw new Error('Cannot map non-BookingEntity to persistence format');
    }

    const record: Record<string, unknown> = {
      item_id: entity.itemId,
      item_type: entity.itemType,
      user_id: entity.guestId,
      check_in: entity.stayPeriod.checkIn,
      check_out: entity.stayPeriod.checkOut,
      total_price: entity.totalPrice.amount,
      currency: entity.totalPrice.currency,
      guests: entity.guestsCount,
      message: entity.message ?? null,
      payment_method: entity.paymentMethod ?? 'card',
      status: entity.status,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };

    if (entity.id) {
      record.id = entity.id;
    }

    return record;
  }
}
