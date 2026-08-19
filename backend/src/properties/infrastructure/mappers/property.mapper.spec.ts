import { PropertyMapper, PropertyPersistenceRow } from './property.mapper';
import { PropertyEntity } from '../../domain/entities/property.entity';
import { Money } from '../../../common/domain/value-objects/money.vo';

describe('PropertyMapper', () => {
  const sampleRow: PropertyPersistenceRow = {
    id: 'prop-123',
    title: 'Seaview Penthouse',
    type: 'penthouse',
    location: 'Cleopatra Beach',
    price_per_night: 200,
    currency: 'EUR',
    cleaning_fee: 60,
    min_stay_nights: 2,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 2,
    beds: 3,
    host_id: 'host-999',
    images: ['https://example.com/p1.jpg'],
    amenities: ['wifi', 'pool'],
    description: 'Amazing penthouse with rooftop view.',
    status: 'approved',
    rejection_reason: null,
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
  };

  describe('toDomain', () => {
    it('should map a database row to a rich PropertyEntity', () => {
      const entity = PropertyMapper.toDomain(sampleRow);

      expect(entity).toBeInstanceOf(PropertyEntity);
      expect(entity.id).toBe('prop-123');
      expect(entity.title).toBe('Seaview Penthouse');
      expect(entity.type).toBe('penthouse');
      expect(entity.location).toBe('Cleopatra Beach');
      expect(entity.pricePerNight.amount).toBe(200);
      expect(entity.pricePerNight.currency).toBe('EUR');
      expect(entity.cleaningFee?.amount).toBe(60);
      expect(entity.minStayNights).toBe(2);
      expect(entity.maxGuests).toBe(4);
      expect(entity.bedrooms).toBe(2);
      expect(entity.bathrooms).toBe(2);
      expect(entity.beds).toBe(3);
      expect(entity.hostId).toBe('host-999');
      expect(entity.images).toEqual(['https://example.com/p1.jpg']);
      expect(entity.amenities).toEqual(['wifi', 'pool']);
      expect(entity.description).toBe('Amazing penthouse with rooftop view.');
      expect(entity.status).toBe('approved');
      expect(entity.rejectionReason).toBeUndefined();
    });

    it('should throw error when row is null or invalid', () => {
      expect(() => PropertyMapper.toDomain(null)).toThrow(
        'Cannot map invalid or empty database row to PropertyEntity',
      );
    });

    it('should handle optional defaults gracefully when fields are missing', () => {
      const minimalRow: PropertyPersistenceRow = {
        id: 'prop-minimal',
        title: 'Simple Flat',
        type: 'apartment',
        host_id: 'host-1',
        price_per_night: 100,
      };

      const entity = PropertyMapper.toDomain(minimalRow);

      expect(entity.id).toBe('prop-minimal');
      expect(entity.title).toBe('Simple Flat');
      expect(entity.type).toBe('apartment');
      expect(entity.pricePerNight.amount).toBe(100);
      expect(entity.pricePerNight.currency).toBe('EUR');
      expect(entity.cleaningFee).toBeUndefined();
      expect(entity.minStayNights).toBe(1);
      expect(entity.maxGuests).toBe(1);
      expect(entity.status).toBe('pending');
    });
  });

  describe('toPersistence', () => {
    it('should map a PropertyEntity to database persistence format', () => {
      const entity = PropertyEntity.restore({
        id: 'prop-123',
        title: 'Seaview Penthouse',
        type: 'penthouse',
        location: 'Cleopatra Beach',
        pricePerNight: new Money(200, 'EUR'),
        cleaningFee: new Money(60, 'EUR'),
        minStayNights: 2,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        beds: 3,
        hostId: 'host-999',
        images: ['https://example.com/p1.jpg'],
        amenities: ['wifi', 'pool'],
        description: 'Amazing penthouse with rooftop view.',
        status: 'approved',
      });

      const persistence = PropertyMapper.toPersistence(entity);

      expect(persistence.id).toBe('prop-123');
      expect(persistence.title).toBe('Seaview Penthouse');
      expect(persistence.type).toBe('penthouse');
      expect(persistence.location).toBe('Cleopatra Beach');
      expect(persistence.price_per_night).toBe(200);
      expect(persistence.currency).toBe('EUR');
      expect(persistence.cleaning_fee).toBe(60);
      expect(persistence.min_stay_nights).toBe(2);
      expect(persistence.max_guests).toBe(4);
      expect(persistence.bedrooms).toBe(2);
      expect(persistence.bathrooms).toBe(2);
      expect(persistence.beds).toBe(3);
      expect(persistence.host_id).toBe('host-999');
      expect(persistence.images).toEqual(['https://example.com/p1.jpg']);
      expect(persistence.amenities).toEqual(['wifi', 'pool']);
      expect(persistence.status).toBe('approved');
    });

    it('should throw error when mapping non-PropertyEntity', () => {
      expect(() =>
        PropertyMapper.toPersistence(null as unknown as PropertyEntity),
      ).toThrow('Cannot map non-PropertyEntity to persistence format');
    });
  });
});
