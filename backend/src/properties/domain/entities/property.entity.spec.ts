import { PropertyEntity } from './property.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

describe('PropertyEntity', () => {
  const validProps = {
    title: 'Luxury Villa with Sea View',
    type: 'villa',
    location: 'Alanya Center',
    pricePerNight: new Money(150, 'EUR'),
    cleaningFee: new Money(50, 'EUR'),
    minStayNights: 3,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    beds: 4,
    hostId: 'host-123',
    images: ['https://example.com/img1.jpg'],
    amenities: ['wifi', 'pool', 'air_conditioning'],
    description: 'A beautiful luxury villa overlooking the Mediterranean.',
  };

  describe('create', () => {
    it('should successfully create a new PropertyEntity in pending status', () => {
      const property = PropertyEntity.create(validProps);

      expect(property).toBeInstanceOf(PropertyEntity);
      expect(property.id).toBeUndefined();
      expect(property.title).toBe(validProps.title);
      expect(property.type).toBe(validProps.type);
      expect(property.location).toBe(validProps.location);
      expect(property.pricePerNight.amount).toBe(150);
      expect(property.pricePerNight.currency).toBe('EUR');
      expect(property.cleaningFee?.amount).toBe(50);
      expect(property.minStayNights).toBe(3);
      expect(property.maxGuests).toBe(6);
      expect(property.bedrooms).toBe(3);
      expect(property.bathrooms).toBe(2);
      expect(property.beds).toBe(4);
      expect(property.hostId).toBe('host-123');
      expect(property.status).toBe('pending');
      expect(property.isPending()).toBe(true);
      expect(property.isApproved()).toBe(false);
      expect(property.createdAt).toBeInstanceOf(Date);
      expect(property.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if title is empty or missing', () => {
      expect(() => PropertyEntity.create({ ...validProps, title: '' })).toThrow(
        'Invalid property: title is required',
      );
    });

    it('should throw error if type is empty or missing', () => {
      expect(() => PropertyEntity.create({ ...validProps, type: '' })).toThrow(
        'Invalid property: type is required',
      );
    });

    it('should throw error if hostId is empty or missing', () => {
      expect(() =>
        PropertyEntity.create({ ...validProps, hostId: '' }),
      ).toThrow('Invalid property: hostId is required');
    });

    it('should throw error if pricePerNight is invalid', () => {
      expect(() =>
        PropertyEntity.create({
          ...validProps,
          pricePerNight: null as unknown as Money,
        }),
      ).toThrow(
        'Invalid property: pricePerNight must be a valid Money instance',
      );
    });

    it('should throw error if minStayNights is less than 1', () => {
      expect(() =>
        PropertyEntity.create({ ...validProps, minStayNights: 0 }),
      ).toThrow('Invalid property: minStayNights must be an integer >= 1');
    });

    it('should throw error if maxGuests is less than 1', () => {
      expect(() =>
        PropertyEntity.create({ ...validProps, maxGuests: 0 }),
      ).toThrow('Invalid property: maxGuests must be an integer >= 1');
    });
  });

  describe('restore', () => {
    it('should reconstitute an existing PropertyEntity with id and status', () => {
      const restored = PropertyEntity.restore({
        id: 'prop-uuid-1',
        ...validProps,
        status: 'approved',
        rejectionReason: undefined,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      });

      expect(restored.id).toBe('prop-uuid-1');
      expect(restored.status).toBe('approved');
      expect(restored.isApproved()).toBe(true);
      expect(restored.createdAt).toEqual(new Date('2026-01-01T00:00:00Z'));
    });

    it('should throw error if id is missing in restore', () => {
      expect(() =>
        PropertyEntity.restore({
          id: '',
          ...validProps,
          status: 'approved',
        }),
      ).toThrow('Invalid restore: id is required');
    });
  });

  describe('business invariants & domain methods', () => {
    let property: PropertyEntity;

    beforeEach(() => {
      property = PropertyEntity.create(validProps);
    });

    describe('capacity validation', () => {
      it('should return true if guest count is within capacity', () => {
        expect(property.canAccommodate(1)).toBe(true);
        expect(property.canAccommodate(6)).toBe(true);
      });

      it('should return false if guest count exceeds maxGuests or is <= 0', () => {
        expect(property.canAccommodate(7)).toBe(false);
        expect(property.canAccommodate(0)).toBe(false);
        expect(property.canAccommodate(-1)).toBe(false);
      });
    });

    describe('stay duration validation', () => {
      it('should validate minimum stay requirements', () => {
        expect(property.validateStayDuration(3)).toBe(true);
        expect(property.validateStayDuration(5)).toBe(true);
        expect(property.validateStayDuration(2)).toBe(false);
        expect(property.validateStayDuration(0)).toBe(false);
      });
    });

    describe('total price calculation', () => {
      it('should calculate total price for given nights including cleaning fee', () => {
        const total = property.calculateTotalPrice(4);
        // (150 * 4) + 50 = 650
        expect(total.amount).toBe(650);
        expect(total.currency).toBe('EUR');
      });

      it('should calculate total price when no cleaning fee is present', () => {
        const noFeeProp = PropertyEntity.create({
          ...validProps,
          cleaningFee: undefined,
        });
        const total = noFeeProp.calculateTotalPrice(3);
        // 150 * 3 = 450
        expect(total.amount).toBe(450);
        expect(total.currency).toBe('EUR');
      });

      it('should throw error if nights is less than 1', () => {
        expect(() => property.calculateTotalPrice(0)).toThrow(
          'Invalid stay duration: nights must be an integer >= 1',
        );
      });
    });

    describe('status transitions', () => {
      it('should approve property and clear rejection reason', () => {
        property.approve();
        expect(property.status).toBe('approved');
        expect(property.isApproved()).toBe(true);
        expect(property.rejectionReason).toBeUndefined();
      });

      it('should reject property with a reason', () => {
        property.reject('Incomplete documentation');
        expect(property.status).toBe('rejected');
        expect(property.isRejected()).toBe(true);
        expect(property.rejectionReason).toBe('Incomplete documentation');
      });

      it('should archive property', () => {
        property.archive();
        expect(property.status).toBe('archived');
        expect(property.isArchived()).toBe(true);
      });
    });
  });
});
