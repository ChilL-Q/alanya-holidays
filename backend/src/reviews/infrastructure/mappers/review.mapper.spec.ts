import { ReviewMapper } from './review.mapper';
import { ReviewEntity } from '../../domain/entities/review.entity';
import { ReviewRating } from '../../../common/domain/value-objects/review-rating.vo';

describe('ReviewMapper', () => {
  const dbRow = {
    id: 'rev-101',
    listing_id: 'list-202',
    user_id: 'user-303',
    rating: 4.5,
    comment: 'Spectacular views and great host!',
    status: 'approved',
    created_at: '2026-05-10T12:00:00Z',
    updated_at: '2026-05-10T12:30:00Z',
    user: {
      full_name: 'John Doe',
      avatar_url: 'https://example.com/john.jpg',
    },
    listing: {
      id: 'list-202',
      name: 'Sunset Villa',
    },
  };

  describe('toDomain', () => {
    it('should map full Supabase database record to ReviewEntity', () => {
      const entity = ReviewMapper.toDomain(dbRow);

      expect(entity).toBeInstanceOf(ReviewEntity);
      expect(entity.id).toBe('rev-101');
      expect(entity.listingId).toBe('list-202');
      expect(entity.userId).toBe('user-303');
      expect(entity.rating).toBeInstanceOf(ReviewRating);
      expect(entity.ratingValue).toBe(4.5);
      expect(entity.comment).toBe('Spectacular views and great host!');
      expect(entity.status).toBe('approved');
      expect(entity.isApproved()).toBe(true);
      expect(entity.user).toEqual({
        fullName: 'John Doe',
        avatarUrl: 'https://example.com/john.jpg',
      });
      expect(entity.listing).toEqual({
        id: 'list-202',
        name: 'Sunset Villa',
      });
      expect(entity.createdAt).toEqual(new Date('2026-05-10T12:00:00Z'));
      expect(entity.updatedAt).toEqual(new Date('2026-05-10T12:30:00Z'));
    });

    it('should handle camelCase property names and missing relations', () => {
      const camelRow = {
        id: 'rev-102',
        listingId: 'list-203',
        userId: 'user-304',
        rating: 5,
        comment: 'Flawless',
        status: 'pending',
        createdAt: new Date('2026-06-01'),
      };

      const entity = ReviewMapper.toDomain(camelRow);
      expect(entity.id).toBe('rev-102');
      expect(entity.listingId).toBe('list-203');
      expect(entity.userId).toBe('user-304');
      expect(entity.ratingValue).toBe(5);
      expect(entity.status).toBe('pending');
      expect(entity.user).toBeUndefined();
      expect(entity.listing).toBeUndefined();
    });

    it('should throw error when mapping null or undefined row', () => {
      expect(() => ReviewMapper.toDomain(null)).toThrow(
        'Cannot map invalid or empty database row to ReviewEntity',
      );
      expect(() => ReviewMapper.toDomain(undefined)).toThrow(
        'Cannot map invalid or empty database row to ReviewEntity',
      );
    });
  });

  describe('toPersistence', () => {
    it('should map ReviewEntity to database persistence record', () => {
      const entity = ReviewEntity.restore({
        id: 'rev-500',
        listingId: 'list-600',
        userId: 'user-700',
        rating: 4,
        comment: 'Very cozy apartment',
        status: 'approved',
        createdAt: new Date('2026-07-01T10:00:00.000Z'),
        updatedAt: new Date('2026-07-02T10:00:00.000Z'),
      });

      const persistence = ReviewMapper.toPersistence(entity);

      expect(persistence).toEqual({
        id: 'rev-500',
        listing_id: 'list-600',
        user_id: 'user-700',
        rating: 4,
        comment: 'Very cozy apartment',
        status: 'approved',
        created_at: '2026-07-01T10:00:00.000Z',
        updated_at: '2026-07-02T10:00:00.000Z',
      });
    });

    it('should throw error when mapping non-ReviewEntity', () => {
      expect(() =>
        ReviewMapper.toPersistence({} as unknown as ReviewEntity),
      ).toThrow('Cannot map non-ReviewEntity to persistence format');
    });
  });
});
