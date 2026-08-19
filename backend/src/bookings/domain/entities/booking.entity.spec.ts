import { StayPeriod, Money } from '../value-objects';
import { BookingEntity, BookingItemType } from './booking.entity';

describe('BookingEntity', () => {
  const validStayPeriod = new StayPeriod(
    '2026-06-01T12:00:00.000Z',
    '2026-06-08T10:00:00.000Z',
  );
  const validTotalPrice = new Money(700, 'EUR');

  const createValidProps = () => ({
    itemId: 'prop-123',
    itemType: 'property' as BookingItemType,
    guestId: 'guest-456',
    stayPeriod: validStayPeriod,
    totalPrice: validTotalPrice,
    guestsCount: 2,
    message: 'Looking forward to our stay!',
    paymentMethod: 'credit_card',
  });

  describe('BookingEntity.create factory method', () => {
    it('should create a valid BookingEntity instance in pending status', () => {
      const props = createValidProps();
      const booking = BookingEntity.create(props);

      expect(booking).toBeInstanceOf(BookingEntity);
      expect(booking.id).toBeUndefined();
      expect(booking.itemId).toBe('prop-123');
      expect(booking.itemType).toBe('property');
      expect(booking.guestId).toBe('guest-456');
      expect(booking.stayPeriod.equals(validStayPeriod)).toBe(true);
      expect(booking.totalPrice.equals(validTotalPrice)).toBe(true);
      expect(booking.guestsCount).toBe(2);
      expect(booking.message).toBe('Looking forward to our stay!');
      expect(booking.paymentMethod).toBe('credit_card');
      expect(booking.status).toBe('pending');
      expect(booking.isPending()).toBe(true);
      expect(booking.isConfirmed()).toBe(false);
      expect(booking.isCancelled()).toBe(false);
      expect(booking.isRejected()).toBe(false);
      expect(booking.createdAt).toBeInstanceOf(Date);
      expect(booking.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw an error if itemId is empty or not provided', () => {
      const props = { ...createValidProps(), itemId: '' };
      expect(() => BookingEntity.create(props)).toThrow(
        'Invalid booking: itemId is required',
      );
    });

    it('should throw an error if guestId is empty or not provided', () => {
      const props = { ...createValidProps(), guestId: '   ' };
      expect(() => BookingEntity.create(props)).toThrow(
        'Invalid booking: guestId is required',
      );
    });

    it('should throw an error if itemType is invalid', () => {
      const props = {
        ...createValidProps(),
        itemType: 'invalid' as unknown as BookingItemType,
      };
      expect(() => BookingEntity.create(props)).toThrow(
        'Invalid booking: itemType must be either property or service',
      );
    });

    it('should throw an error if guestsCount is less than 1 or not an integer', () => {
      expect(() =>
        BookingEntity.create({ ...createValidProps(), guestsCount: 0 }),
      ).toThrow('Invalid booking: guestsCount must be a positive integer');

      expect(() =>
        BookingEntity.create({ ...createValidProps(), guestsCount: -2 }),
      ).toThrow('Invalid booking: guestsCount must be a positive integer');

      expect(() =>
        BookingEntity.create({ ...createValidProps(), guestsCount: 1.5 }),
      ).toThrow('Invalid booking: guestsCount must be a positive integer');
    });

    it('should throw an error if stayPeriod is missing', () => {
      expect(() =>
        BookingEntity.create({
          ...createValidProps(),
          stayPeriod: null as unknown as StayPeriod,
        }),
      ).toThrow('Invalid booking: valid StayPeriod is required');
    });

    it('should throw an error if totalPrice is missing', () => {
      expect(() =>
        BookingEntity.create({
          ...createValidProps(),
          totalPrice: null as unknown as Money,
        }),
      ).toThrow('Invalid booking: valid totalPrice Money is required');
    });
  });

  describe('BookingEntity.restore factory method', () => {
    it('should restore an existing booking entity from database state', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');

      const booking = BookingEntity.restore({
        id: 'book-999',
        itemId: 'srv-456',
        itemType: 'service',
        guestId: 'guest-789',
        stayPeriod: validStayPeriod,
        totalPrice: validTotalPrice,
        status: 'confirmed',
        guestsCount: 4,
        message: 'Airport transfer needed',
        paymentMethod: 'cash',
        createdAt,
        updatedAt,
      });

      expect(booking.id).toBe('book-999');
      expect(booking.itemId).toBe('srv-456');
      expect(booking.itemType).toBe('service');
      expect(booking.guestId).toBe('guest-789');
      expect(booking.status).toBe('confirmed');
      expect(booking.isConfirmed()).toBe(true);
      expect(booking.guestsCount).toBe(4);
      expect(booking.message).toBe('Airport transfer needed');
      expect(booking.paymentMethod).toBe('cash');
      expect(booking.createdAt).toEqual(createdAt);
      expect(booking.updatedAt).toEqual(updatedAt);
    });

    it('should throw error when restoring with empty id', () => {
      expect(() =>
        BookingEntity.restore({
          id: '',
          itemId: 'srv-456',
          itemType: 'service',
          guestId: 'guest-789',
          stayPeriod: validStayPeriod,
          totalPrice: validTotalPrice,
          status: 'confirmed',
          guestsCount: 4,
        }),
      ).toThrow('Invalid restore: id is required');
    });
  });

  describe('calculateNights', () => {
    it('should delegate nights calculation to StayPeriod', () => {
      const booking = BookingEntity.create(createValidProps());
      expect(booking.calculateNights()).toBe(7);
    });
  });

  describe('confirm transition', () => {
    it('should transition status from pending to confirmed', () => {
      const booking = BookingEntity.create(createValidProps());
      expect(booking.status).toBe('pending');

      booking.confirm();

      expect(booking.status).toBe('confirmed');
      expect(booking.isConfirmed()).toBe(true);
      expect(booking.isPending()).toBe(false);
    });

    it('should throw error when trying to confirm a booking that is not pending', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.confirm();

      expect(() => booking.confirm()).toThrow(
        "Cannot confirm booking with status 'confirmed'",
      );
    });

    it('should throw error when confirming a cancelled booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.cancel('guest-456');

      expect(() => booking.confirm()).toThrow(
        "Cannot confirm booking with status 'cancelled'",
      );
    });
  });

  describe('reject transition', () => {
    it('should transition status from pending to rejected', () => {
      const booking = BookingEntity.create(createValidProps());
      expect(booking.status).toBe('pending');

      booking.reject();

      expect(booking.status).toBe('rejected');
      expect(booking.isRejected()).toBe(true);
      expect(booking.isPending()).toBe(false);
    });

    it('should throw error when trying to reject a non-pending booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.confirm();

      expect(() => booking.reject()).toThrow(
        "Cannot reject booking with status 'confirmed'",
      );
    });
  });

  describe('complete transition', () => {
    it('should transition status from confirmed to completed', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.confirm();

      booking.complete();

      expect(booking.status).toBe('completed');
    });

    it('should throw error when trying to complete a pending booking', () => {
      const booking = BookingEntity.create(createValidProps());

      expect(() => booking.complete()).toThrow(
        "Cannot complete booking with status 'pending'",
      );
    });
  });

  describe('cancel and canBeCancelledBy', () => {
    it('should allow the guest to cancel a pending or confirmed booking', () => {
      const booking = BookingEntity.create(createValidProps());
      expect(booking.canBeCancelledBy('guest-456')).toBe(true);

      booking.cancel('guest-456');

      expect(booking.status).toBe('cancelled');
      expect(booking.isCancelled()).toBe(true);
    });

    it('should allow guest to cancel a confirmed booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.confirm();
      expect(booking.canBeCancelledBy('guest-456')).toBe(true);

      booking.cancel('guest-456');
      expect(booking.isCancelled()).toBe(true);
    });

    it('should not allow another user to cancel the booking', () => {
      const booking = BookingEntity.create(createValidProps());
      expect(booking.canBeCancelledBy('other-user-999')).toBe(false);

      expect(() => booking.cancel('other-user-999')).toThrow(
        'Booking cannot be cancelled by this user or in current status',
      );
    });

    it('should not allow cancelling an already cancelled booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.cancel('guest-456');

      expect(booking.canBeCancelledBy('guest-456')).toBe(false);
      expect(() => booking.cancel('guest-456')).toThrow(
        'Booking cannot be cancelled by this user or in current status',
      );
    });

    it('should not allow cancelling a rejected booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.reject();

      expect(booking.canBeCancelledBy('guest-456')).toBe(false);
      expect(() => booking.cancel('guest-456')).toThrow(
        'Booking cannot be cancelled by this user or in current status',
      );
    });

    it('should not allow cancelling a completed booking', () => {
      const booking = BookingEntity.create(createValidProps());
      booking.confirm();
      booking.complete();

      expect(booking.canBeCancelledBy('guest-456')).toBe(false);
      expect(() => booking.cancel('guest-456')).toThrow(
        'Booking cannot be cancelled by this user or in current status',
      );
    });
  });
});
