import { ServiceOfferingEntity } from './service-offering.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

describe('ServiceOfferingEntity', () => {
  const validProps = {
    title: 'Luxury Yacht Cruise',
    type: 'yacht',
    providerId: 'provider-123',
    price: new Money(350, 'EUR'),
    priceUnit: 'per_day',
    capacity: 10,
    location: 'Alanya Marina',
    description: 'A full-day luxury yacht cruise along the Turquoise Coast.',
    images: ['https://example.com/yacht1.jpg'],
    features: { brand: 'Azimut', model: '55 Fly' },
    details: { captainIncluded: true, mealsIncluded: true },
  };

  describe('create', () => {
    it('should create a valid ServiceOfferingEntity in pending status', () => {
      const entity = ServiceOfferingEntity.create(validProps);

      expect(entity).toBeDefined();
      expect(entity.id).toBeUndefined();
      expect(entity.title).toBe('Luxury Yacht Cruise');
      expect(entity.type).toBe('yacht');
      expect(entity.providerId).toBe('provider-123');
      expect(entity.price.amount).toBe(350);
      expect(entity.price.currency).toBe('EUR');
      expect(entity.priceUnit).toBe('per_day');
      expect(entity.capacity).toBe(10);
      expect(entity.location).toBe('Alanya Marina');
      expect(entity.description).toBe(
        'A full-day luxury yacht cruise along the Turquoise Coast.',
      );
      expect(entity.images).toEqual(['https://example.com/yacht1.jpg']);
      expect(entity.features).toEqual({ brand: 'Azimut', model: '55 Fly' });
      expect(entity.details).toEqual({
        captainIncluded: true,
        mealsIncluded: true,
      });
      expect(entity.status).toBe('pending');
      expect(entity.isPending()).toBe(true);
      expect(entity.isApproved()).toBe(false);
      expect(entity.isRejected()).toBe(false);
      expect(entity.isArchived()).toBe(false);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if title is empty or invalid', () => {
      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, title: '' }),
      ).toThrow('Invalid service offering: title is required');

      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, title: '   ' }),
      ).toThrow('Invalid service offering: title is required');
    });

    it('should throw error if type is empty or invalid', () => {
      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, type: '' }),
      ).toThrow('Invalid service offering: type is required');
    });

    it('should throw error if providerId is empty or invalid', () => {
      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, providerId: '' }),
      ).toThrow('Invalid service offering: providerId is required');
    });

    it('should throw error if price is not a Money instance', () => {
      expect(() =>
        ServiceOfferingEntity.create({
          ...validProps,
          price: null as unknown as Money,
        }),
      ).toThrow(
        'Invalid service offering: price must be a valid Money instance',
      );
    });

    it('should throw error if capacity is negative or not an integer', () => {
      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, capacity: -2 }),
      ).toThrow(
        'Invalid service offering: capacity must be a non-negative integer',
      );

      expect(() =>
        ServiceOfferingEntity.create({ ...validProps, capacity: 2.5 }),
      ).toThrow(
        'Invalid service offering: capacity must be a non-negative integer',
      );
    });
  });

  describe('restore', () => {
    it('should reconstitute an existing ServiceOfferingEntity from storage', () => {
      const now = new Date();
      const entity = ServiceOfferingEntity.restore({
        ...validProps,
        id: 'srv-999',
        serviceRef: 1042,
        status: 'approved',
        rejectionReason: undefined,
        rating: 4.8,
        reviewCount: 25,
        createdAt: now,
        updatedAt: now,
      });

      expect(entity.id).toBe('srv-999');
      expect(entity.serviceRef).toBe(1042);
      expect(entity.status).toBe('approved');
      expect(entity.isApproved()).toBe(true);
      expect(entity.rating).toBe(4.8);
      expect(entity.reviewCount).toBe(25);
    });

    it('should throw error when restoring without id', () => {
      expect(() =>
        ServiceOfferingEntity.restore({
          ...validProps,
          id: '',
          status: 'approved',
        }),
      ).toThrow('Invalid restore: id is required');
    });
  });

  describe('canAccommodateParty', () => {
    it('should return true when party size is within capacity', () => {
      const entity = ServiceOfferingEntity.create({
        ...validProps,
        capacity: 8,
      });

      expect(entity.canAccommodateParty(1)).toBe(true);
      expect(entity.canAccommodateParty(8)).toBe(true);
      expect(entity.canAccommodateParty(9)).toBe(false);
      expect(entity.canAccommodateParty(0)).toBe(false);
      expect(entity.canAccommodateParty(-1)).toBe(false);
    });

    it('should return true for any positive party size if capacity is not set', () => {
      const entity = ServiceOfferingEntity.create({
        ...validProps,
        capacity: undefined,
      });

      expect(entity.canAccommodateParty(5)).toBe(true);
      expect(entity.canAccommodateParty(100)).toBe(true);
      expect(entity.canAccommodateParty(0)).toBe(false);
    });
  });

  describe('calculateCost', () => {
    it('should calculate total cost for given units', () => {
      const entity = ServiceOfferingEntity.create({
        ...validProps,
        price: new Money(150, 'EUR'),
      });

      const cost3 = entity.calculateCost(3);
      expect(cost3.amount).toBe(450);
      expect(cost3.currency).toBe('EUR');

      const cost1 = entity.calculateCost(1);
      expect(cost1.amount).toBe(150);
    });

    it('should throw error for invalid units', () => {
      const entity = ServiceOfferingEntity.create(validProps);

      expect(() => entity.calculateCost(0)).toThrow(
        'Invalid units: must be a positive number',
      );
      expect(() => entity.calculateCost(-3)).toThrow(
        'Invalid units: must be a positive number',
      );
      expect(() => entity.calculateCost(NaN)).toThrow(
        'Invalid units: must be a positive number',
      );
    });
  });

  describe('status transitions', () => {
    it('should approve and clear rejection reason', () => {
      const entity = ServiceOfferingEntity.restore({
        ...validProps,
        id: 'srv-1',
        status: 'rejected',
        rejectionReason: 'Missing license',
      });

      entity.approve();

      expect(entity.status).toBe('approved');
      expect(entity.isApproved()).toBe(true);
      expect(entity.rejectionReason).toBeUndefined();
    });

    it('should reject with given reason', () => {
      const entity = ServiceOfferingEntity.create(validProps);

      entity.reject('Incomplete documentation');

      expect(entity.status).toBe('rejected');
      expect(entity.isRejected()).toBe(true);
      expect(entity.rejectionReason).toBe('Incomplete documentation');
    });

    it('should archive service', () => {
      const entity = ServiceOfferingEntity.create(validProps);

      entity.archive();

      expect(entity.status).toBe('archived');
      expect(entity.isArchived()).toBe(true);
    });
  });
});
