import { BookingMapper } from './booking.mapper';
import { BookingEntity, Money, StayPeriod } from '../domain';

describe('BookingMapper', () => {
  const validDbRow = {
    id: 'b-12345',
    item_id: 'prop-999',
    item_type: 'property',
    user_id: 'user-777',
    check_in: '2026-08-01',
    check_out: '2026-08-05',
    total_price: '450.50',
    currency: 'EUR',
    status: 'confirmed',
    guests: 3,
    message: 'Late check-in requested',
    payment_method: 'card',
    created_at: '2026-07-20T10:00:00.000Z',
    updated_at: '2026-07-20T12:00:00.000Z',
  };

  describe('toDomain', () => {
    it('should map a complete DB row to a rich BookingEntity', () => {
      const entity = BookingMapper.toDomain(validDbRow);

      expect(entity).toBeInstanceOf(BookingEntity);
      expect(entity.id).toBe('b-12345');
      expect(entity.itemId).toBe('prop-999');
      expect(entity.itemType).toBe('property');
      expect(entity.guestId).toBe('user-777');
      expect(entity.stayPeriod.checkIn).toBe('2026-08-01');
      expect(entity.stayPeriod.checkOut).toBe('2026-08-05');
      expect(entity.stayPeriod.getNightsCount()).toBe(4);
      expect(entity.totalPrice.amount).toBe(450.5);
      expect(entity.totalPrice.currency).toBe('EUR');
      expect(entity.status).toBe('confirmed');
      expect(entity.guestsCount).toBe(3);
      expect(entity.message).toBe('Late check-in requested');
      expect(entity.paymentMethod).toBe('card');
      expect(entity.createdAt).toEqual(new Date('2026-07-20T10:00:00.000Z'));
      expect(entity.updatedAt).toEqual(new Date('2026-07-20T12:00:00.000Z'));
    });

    it('should support alternative fallback columns (property_id, guest_id, guests_count)', () => {
      const altRow = {
        id: 'b-alt-1',
        property_id: 'prop-fallback',
        guest_id: 'user-fallback',
        check_in: '2026-09-01',
        check_out: '2026-09-03',
        total_price: 200,
        guests_count: 2,
      };

      const entity = BookingMapper.toDomain(altRow);
      expect(entity.itemId).toBe('prop-fallback');
      expect(entity.itemType).toBe('property');
      expect(entity.guestId).toBe('user-fallback');
      expect(entity.guestsCount).toBe(2);
      expect(entity.totalPrice.currency).toBe('EUR');
      expect(entity.status).toBe('pending');
    });

    it('should map a service booking correctly', () => {
      const serviceRow = {
        id: 'b-srv-1',
        service_id: 'serv-100',
        item_type: 'service',
        user_id: 'user-200',
        check_in: '2026-08-10',
        check_out: '2026-08-12',
        total_price: 150,
        currency: 'USD',
        status: 'pending',
      };

      const entity = BookingMapper.toDomain(serviceRow);
      expect(entity.itemType).toBe('service');
      expect(entity.itemId).toBe('serv-100');
      expect(entity.totalPrice.currency).toBe('USD');
    });

    it('should throw an error if row is null or undefined', () => {
      expect(() => BookingMapper.toDomain(null)).toThrow(
        'Cannot map invalid or empty database row to BookingEntity',
      );
      expect(() => BookingMapper.toDomain(undefined)).toThrow(
        'Cannot map invalid or empty database row to BookingEntity',
      );
    });

    it('should throw an error if dates are invalid', () => {
      expect(() =>
        BookingMapper.toDomain({
          ...validDbRow,
          check_in: 'invalid-date',
        }),
      ).toThrow();
    });

    it('should throw an error if total price is invalid', () => {
      expect(() =>
        BookingMapper.toDomain({
          ...validDbRow,
          total_price: -50,
        }),
      ).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('should map a BookingEntity to a persistence record', () => {
      const entity = BookingMapper.toDomain(validDbRow);
      const record = BookingMapper.toPersistence(entity);

      expect(record.id).toBe('b-12345');
      expect(record.item_id).toBe('prop-999');
      expect(record.item_type).toBe('property');
      expect(record.user_id).toBe('user-777');
      expect(record.check_in).toBe('2026-08-01');
      expect(record.check_out).toBe('2026-08-05');
      expect(record.total_price).toBe(450.5);
      expect(record.currency).toBe('EUR');
      expect(record.guests).toBe(3);
      expect(record.message).toBe('Late check-in requested');
      expect(record.payment_method).toBe('card');
      expect(record.status).toBe('confirmed');
      expect(record.created_at).toBe('2026-07-20T10:00:00.000Z');
      expect(record.updated_at).toBe('2026-07-20T12:00:00.000Z');
    });

    it('should map a newly created entity without id', () => {
      const newEntity = BookingEntity.create({
        itemId: 'prop-new',
        itemType: 'property',
        guestId: 'user-new',
        stayPeriod: new StayPeriod('2026-10-01', '2026-10-05'),
        totalPrice: new Money(600, 'EUR'),
        guestsCount: 2,
      });

      const record = BookingMapper.toPersistence(newEntity);
      expect(record.id).toBeUndefined();
      expect(record.item_id).toBe('prop-new');
      expect(record.item_type).toBe('property');
      expect(record.user_id).toBe('user-new');
      expect(record.check_in).toBe('2026-10-01');
      expect(record.check_out).toBe('2026-10-05');
      expect(record.total_price).toBe(600);
      expect(record.currency).toBe('EUR');
      expect(record.guests).toBe(2);
      expect(record.status).toBe('pending');
    });

    it('should throw an error if passed entity is not a BookingEntity', () => {
      expect(() =>
        BookingMapper.toPersistence({} as unknown as BookingEntity),
      ).toThrow('Cannot map non-BookingEntity to persistence format');
    });
  });

  describe('Bidirectional Roundtrip', () => {
    it('should cleanly roundtrip between DB row -> Entity -> DB row', () => {
      const domainEntity = BookingMapper.toDomain(validDbRow);
      const persistenceRow = BookingMapper.toPersistence(domainEntity);
      const reconstructedEntity = BookingMapper.toDomain(persistenceRow);

      expect(reconstructedEntity.id).toBe(domainEntity.id);
      expect(reconstructedEntity.itemId).toBe(domainEntity.itemId);
      expect(reconstructedEntity.itemType).toBe(domainEntity.itemType);
      expect(reconstructedEntity.guestId).toBe(domainEntity.guestId);
      expect(
        reconstructedEntity.stayPeriod.equals(domainEntity.stayPeriod),
      ).toBe(true);
      expect(
        reconstructedEntity.totalPrice.equals(domainEntity.totalPrice),
      ).toBe(true);
      expect(reconstructedEntity.status).toBe(domainEntity.status);
      expect(reconstructedEntity.guestsCount).toBe(domainEntity.guestsCount);
    });
  });
});
