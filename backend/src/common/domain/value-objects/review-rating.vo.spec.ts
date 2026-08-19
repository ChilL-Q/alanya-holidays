import { ReviewRating } from './review-rating.vo';

describe('ReviewRating Value Object', () => {
  describe('Creation and Validation', () => {
    it('should create valid ReviewRating instances for integer ratings 1 to 5', () => {
      const ratings = [1, 2, 3, 4, 5];
      ratings.forEach((val) => {
        const rating = new ReviewRating(val);
        expect(rating.value).toBe(val);
      });
    });

    it('should create valid ReviewRating instances for half-star ratings (1.5, 2.5, 3.5, 4.5)', () => {
      const halfRatings = [1.5, 2.5, 3.5, 4.5];
      halfRatings.forEach((val) => {
        const rating = new ReviewRating(val);
        expect(rating.value).toBe(val);
      });
    });

    it('should throw an error for ratings below 1', () => {
      expect(() => new ReviewRating(0.5)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
      expect(() => new ReviewRating(0)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
      expect(() => new ReviewRating(-1)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
    });

    it('should throw an error for ratings above 5', () => {
      expect(() => new ReviewRating(5.5)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
      expect(() => new ReviewRating(10)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
    });

    it('should throw an error for ratings not in increments of 0.5', () => {
      expect(() => new ReviewRating(3.2)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
      expect(() => new ReviewRating(4.75)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
    });

    it('should throw an error for NaN or non-finite numbers', () => {
      expect(() => new ReviewRating(NaN)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
      expect(() => new ReviewRating(Infinity)).toThrow(
        'Invalid rating: must be a number between 1 and 5 in increments of 0.5',
      );
    });
  });

  describe('ReviewRating.isValid()', () => {
    it('should return true for valid ratings', () => {
      expect(ReviewRating.isValid(1)).toBe(true);
      expect(ReviewRating.isValid(2.5)).toBe(true);
      expect(ReviewRating.isValid(4)).toBe(true);
      expect(ReviewRating.isValid(5)).toBe(true);
    });

    it('should return false for invalid ratings', () => {
      expect(ReviewRating.isValid(0)).toBe(false);
      expect(ReviewRating.isValid(5.5)).toBe(false);
      expect(ReviewRating.isValid(3.7)).toBe(false);
      expect(ReviewRating.isValid(NaN)).toBe(false);
      expect(ReviewRating.isValid(null as unknown as number)).toBe(false);
      expect(ReviewRating.isValid(undefined as unknown as number)).toBe(false);
    });
  });

  describe('ReviewRating.create() factory', () => {
    it('should create an instance via factory method', () => {
      const rating = ReviewRating.create(4.5);
      expect(rating).toBeInstanceOf(ReviewRating);
      expect(rating.value).toBe(4.5);
    });
  });

  describe('equals()', () => {
    it('should return true for equal ratings', () => {
      const a = new ReviewRating(4.5);
      const b = new ReviewRating(4.5);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different ratings', () => {
      const a = new ReviewRating(4.5);
      const b = new ReviewRating(4.0);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false for null/undefined comparisons', () => {
      const a = new ReviewRating(5);
      expect(a.equals(null as unknown as ReviewRating)).toBe(false);
      expect(a.equals(undefined as unknown as ReviewRating)).toBe(false);
    });
  });

  describe('format()', () => {
    it('should format rating as readable string', () => {
      const rating45 = new ReviewRating(4.5);
      expect(rating45.format()).toBe('4.5 / 5');

      const rating5 = new ReviewRating(5);
      expect(rating5.format()).toBe('5 / 5');
    });
  });

  describe('isPerfect()', () => {
    it('should return true only for rating 5', () => {
      expect(new ReviewRating(5).isPerfect()).toBe(true);
      expect(new ReviewRating(4.5).isPerfect()).toBe(false);
      expect(new ReviewRating(1).isPerfect()).toBe(false);
    });
  });
});
