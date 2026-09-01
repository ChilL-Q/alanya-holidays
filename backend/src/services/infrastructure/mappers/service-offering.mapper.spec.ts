import { ServiceOfferingMapper } from './service-offering.mapper';
import { ServiceOfferingEntity } from '../../domain/entities/service-offering.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

describe('ServiceOfferingMapper', () => {
  const sampleRow = {
    id: 'srv-100',
    title: 'Private Yacht Charter',
    type: 'yacht',
    provider_id: 'provider-1',
    price: 500,
    currency: 'EUR',
    price_unit: 'per_day',
    capacity: 12,
    location: 'Alanya Port',
    description: 'Exclusive luxury yacht cruise.',
    images: ['https://example.com/img1.jpg'],
    features: { brand: 'Princess', model: 'V50' },
    details: { skipper: true },
    service_ref: 2001,
    status: 'approved',
    rejection_reason: null,
    rating: 4.9,
    review_count: 30,
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-02T12:00:00.000Z',
  };

  describe('toDomain', () => {
    it('should map valid persistence row to ServiceOfferingEntity', () => {
      const entity = ServiceOfferingMapper.toDomain(sampleRow);

      expect(entity).toBeInstanceOf(ServiceOfferingEntity);
      expect(entity.id).toBe('srv-100');
      expect(entity.title).toBe('Private Yacht Charter');
      expect(entity.type).toBe('yacht');
      expect(entity.providerId).toBe('provider-1');
      expect(entity.price.amount).toBe(500);
      expect(entity.price.currency).toBe('EUR');
      expect(entity.priceUnit).toBe('per_day');
      expect(entity.capacity).toBe(12);
      expect(entity.location).toBe('Alanya Port');
      expect(entity.description).toBe('Exclusive luxury yacht cruise.');
      expect(entity.images).toEqual(['https://example.com/img1.jpg']);
      expect(entity.features).toEqual({ brand: 'Princess', model: 'V50' });
      expect(entity.details).toEqual({ skipper: true });
      expect(entity.serviceRef).toBe(2001);
      expect(entity.status).toBe('approved');
      expect(entity.rating).toBe(4.9);
      expect(entity.reviewCount).toBe(30);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalRow = {
        id: 'srv-200',
        title: 'Basic Tour',
        type: 'tour',
        provider_id: 'provider-2',
        price: '100',
      };

      const entity = ServiceOfferingMapper.toDomain(minimalRow);

      expect(entity.id).toBe('srv-200');
      expect(entity.price.amount).toBe(100);
      expect(entity.price.currency).toBe('EUR');
      expect(entity.status).toBe('pending');
      expect(entity.images).toEqual([]);
      expect(entity.features).toEqual({});
      expect(entity.details).toEqual({});
    });

    it('should throw error for null or non-object row', () => {
      expect(() => ServiceOfferingMapper.toDomain(null)).toThrow();
      expect(() => ServiceOfferingMapper.toDomain(undefined)).toThrow();
    });
  });

  describe('toPersistence', () => {
    it('should map ServiceOfferingEntity to persistence record', () => {
      const entity = ServiceOfferingEntity.restore({
        id: 'srv-100',
        title: 'Private Yacht Charter',
        type: 'yacht',
        providerId: 'provider-1',
        price: new Money(500, 'EUR'),
        priceUnit: 'per_day',
        capacity: 12,
        location: 'Alanya Port',
        description: 'Exclusive luxury yacht cruise.',
        images: ['https://example.com/img1.jpg'],
        features: { brand: 'Princess', model: 'V50' },
        details: { skipper: true },
        serviceRef: 2001,
        status: 'approved',
        rating: 4.9,
        reviewCount: 30,
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        updatedAt: new Date('2026-01-02T12:00:00.000Z'),
      });

      const persistence = ServiceOfferingMapper.toPersistence(entity);

      expect(persistence.id).toBe('srv-100');
      expect(persistence.title).toBe('Private Yacht Charter');
      expect(persistence.price).toBe(500);
      expect(persistence.currency).toBe('EUR');
      expect(persistence.price_unit).toBe('per_day');
      expect(persistence.capacity).toBe(12);
      expect(persistence.service_ref).toBe(2001);
      expect(persistence.status).toBe('approved');
      expect(persistence.rating).toBe(4.9);
      expect(persistence.review_count).toBe(30);
    });

    it('should throw error for non-entity instance', () => {
      expect(() =>
        ServiceOfferingMapper.toPersistence(
          null as unknown as ServiceOfferingEntity,
        ),
      ).toThrow('Cannot map non-ServiceOfferingEntity to persistence format');
    });
  });
});
