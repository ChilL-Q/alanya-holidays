import { ReviewEntity } from './review.entity';
import { ReviewRating } from '../../../common/domain/value-objects/review-rating.vo';

describe('ReviewEntity', () => {
  const validProps = {
    id: 'rev-1',
    listingId: 'listing-123',
    userId: 'user-456',
    rating: 4.5,
    comment: 'Amazing place and wonderful experience!',
  };

  describe('creation & validation', () => {
    it('should create a valid review entity with ReviewRating VO', () => {
      const entity = ReviewEntity.create(validProps);

      expect(entity.id).toBe('rev-1');
      expect(entity.listingId).toBe('listing-123');
      expect(entity.userId).toBe('user-456');
      expect(entity.rating).toBeInstanceOf(ReviewRating);
      expect(entity.ratingValue).toBe(4.5);
      expect(entity.comment).toBe('Amazing place and wonderful experience!');
      expect(entity.status).toBe('pending');
      expect(entity.isPending()).toBe(true);
      expect(entity.isApproved()).toBe(false);
      expect(entity.isRejected()).toBe(false);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept an existing ReviewRating VO instance', () => {
      const ratingVo = ReviewRating.create(5);
      const entity = ReviewEntity.create({
        ...validProps,
        rating: ratingVo,
      });

      expect(entity.rating).toBe(ratingVo);
      expect(entity.ratingValue).toBe(5);
    });

    it('should throw error when comment is empty or only whitespace', () => {
      expect(() => ReviewEntity.create({ ...validProps, comment: '' })).toThrow(
        'Review comment cannot be empty',
      );

      expect(() =>
        ReviewEntity.create({ ...validProps, comment: '   ' }),
      ).toThrow('Review comment cannot be empty');
    });

    it('should throw error when comment exceeds 5000 characters', () => {
      const longComment = 'a'.repeat(5001);
      expect(() =>
        ReviewEntity.create({ ...validProps, comment: longComment }),
      ).toThrow('Review comment cannot exceed 5000 characters');
    });

    it('should throw error when rating is invalid', () => {
      expect(() => ReviewEntity.create({ ...validProps, rating: 6 })).toThrow();

      expect(() =>
        ReviewEntity.create({ ...validProps, rating: 0.5 }),
      ).toThrow();
    });

    it('should throw error when listingId or userId is missing/empty', () => {
      expect(() =>
        ReviewEntity.create({ ...validProps, listingId: '' }),
      ).toThrow('Listing ID is required');

      expect(() => ReviewEntity.create({ ...validProps, userId: '' })).toThrow(
        'User ID is required',
      );
    });
  });

  describe('moderation status transitions', () => {
    it('should transition to approved', () => {
      const entity = ReviewEntity.create(validProps);
      expect(entity.status).toBe('pending');

      entity.approve();
      expect(entity.status).toBe('approved');
      expect(entity.isApproved()).toBe(true);
      expect(entity.isPending()).toBe(false);
      expect(entity.isRejected()).toBe(false);
    });

    it('should transition to rejected', () => {
      const entity = ReviewEntity.create(validProps);
      entity.reject();
      expect(entity.status).toBe('rejected');
      expect(entity.isApproved()).toBe(false);
      expect(entity.isPending()).toBe(false);
      expect(entity.isRejected()).toBe(true);
    });
  });

  describe('mutations', () => {
    it('should update comment with validation', () => {
      const entity = ReviewEntity.create(validProps);
      entity.updateComment('Updated comment text');
      expect(entity.comment).toBe('Updated comment text');

      expect(() => entity.updateComment('')).toThrow(
        'Review comment cannot be empty',
      );
    });

    it('should update rating', () => {
      const entity = ReviewEntity.create(validProps);
      entity.updateRating(3.5);
      expect(entity.ratingValue).toBe(3.5);

      entity.updateRating(ReviewRating.create(5));
      expect(entity.ratingValue).toBe(5);
    });
  });

  describe('restore', () => {
    it('should accurately restore ReviewEntity from persistence data', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const entity = ReviewEntity.restore({
        id: 'rev-999',
        listingId: 'list-555',
        userId: 'user-777',
        rating: 4,
        comment: 'Restored review comment',
        status: 'approved',
        createdAt: now,
        updatedAt: now,
        user: {
          fullName: 'Jane Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        listing: { id: 'list-555', name: 'Luxury Villa' },
      });

      expect(entity.id).toBe('rev-999');
      expect(entity.listingId).toBe('list-555');
      expect(entity.userId).toBe('user-777');
      expect(entity.ratingValue).toBe(4);
      expect(entity.comment).toBe('Restored review comment');
      expect(entity.status).toBe('approved');
      expect(entity.isApproved()).toBe(true);
      expect(entity.user?.fullName).toBe('Jane Doe');
      expect(entity.listing?.name).toBe('Luxury Villa');
      expect(entity.createdAt).toEqual(now);
      expect(entity.updatedAt).toEqual(now);
    });

    it('should fallback to pending if status is unknown during restore', () => {
      const entity = ReviewEntity.restore({
        id: 'rev-1',
        listingId: 'list-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Great',
        status: 'unknown_status',
        createdAt: '2026-01-01T00:00:00Z',
      });

      expect(entity.status).toBe('pending');
    });
  });
});
