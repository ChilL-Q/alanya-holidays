import {
  normalizePriceLevel,
  normalizeListingInput,
  validatePhotoLimit,
  validateUUIDs,
  stripProtectedFields,
  getPhotoLimit,
  TIER_PHOTO_LIMITS,
} from './listing-input.schema';

describe('listing-input.schema', () => {
  describe('normalizePriceLevel', () => {
    describe('dollar sign symbols', () => {
      it('should map "$" to 1', () => {
        expect(normalizePriceLevel('$')).toBe(1);
      });

      it('should map "$$" to 2', () => {
        expect(normalizePriceLevel('$$')).toBe(2);
      });

      it('should map "$$$" to 3', () => {
        expect(normalizePriceLevel('$$$')).toBe(3);
      });

      it('should map "$$$$" to 4', () => {
        expect(normalizePriceLevel('$$$$')).toBe(4);
      });

      it('should handle whitespace padded dollar signs', () => {
        expect(normalizePriceLevel(' $ ')).toBe(1);
        expect(normalizePriceLevel('  $$  ')).toBe(2);
        expect(normalizePriceLevel('\t$$$\n')).toBe(3);
        expect(normalizePriceLevel(' $$$$ ')).toBe(4);
      });
    });

    describe('valid integer numbers (1..4)', () => {
      it('should preserve valid integer numbers 1..4 as is', () => {
        expect(normalizePriceLevel(1)).toBe(1);
        expect(normalizePriceLevel(2)).toBe(2);
        expect(normalizePriceLevel(3)).toBe(3);
        expect(normalizePriceLevel(4)).toBe(4);
      });
    });

    describe('numeric strings ("1".."4")', () => {
      it('should convert numeric strings "1".."4" to number integers', () => {
        expect(normalizePriceLevel('1')).toBe(1);
        expect(normalizePriceLevel('2')).toBe(2);
        expect(normalizePriceLevel('3')).toBe(3);
        expect(normalizePriceLevel('4')).toBe(4);
      });

      it('should handle whitespace padded numeric strings', () => {
        expect(normalizePriceLevel(' 1 ')).toBe(1);
        expect(normalizePriceLevel('  2  ')).toBe(2);
        expect(normalizePriceLevel('\t3\n')).toBe(3);
        expect(normalizePriceLevel(' 4 ')).toBe(4);
      });
    });

    describe('invalid, out-of-range, and unrecognized values', () => {
      it('should return undefined for dollar sign strings beyond 4 ("$$$$$")', () => {
        expect(normalizePriceLevel('$$$$$')).toBeUndefined();
        expect(normalizePriceLevel('$$$$$$')).toBeUndefined();
      });

      it('should return undefined for out-of-range integer numbers (0, 5, -1, 100)', () => {
        expect(normalizePriceLevel(0)).toBeUndefined();
        expect(normalizePriceLevel(5)).toBeUndefined();
        expect(normalizePriceLevel(-1)).toBeUndefined();
        expect(normalizePriceLevel(100)).toBeUndefined();
      });

      it('should return undefined for out-of-range numeric strings ("0", "5", "-1")', () => {
        expect(normalizePriceLevel('0')).toBeUndefined();
        expect(normalizePriceLevel('5')).toBeUndefined();
        expect(normalizePriceLevel('-1')).toBeUndefined();
        expect(normalizePriceLevel('99')).toBeUndefined();
      });

      it('should return undefined for non-integer numbers and special numeric values', () => {
        expect(normalizePriceLevel(1.5)).toBeUndefined();
        expect(normalizePriceLevel(2.7)).toBeUndefined();
        expect(normalizePriceLevel(NaN)).toBeUndefined();
        expect(normalizePriceLevel(Infinity)).toBeUndefined();
        expect(normalizePriceLevel(-Infinity)).toBeUndefined();
      });

      it('should return undefined for null, undefined, boolean, object, and array values', () => {
        expect(normalizePriceLevel(null)).toBeUndefined();
        expect(normalizePriceLevel(undefined)).toBeUndefined();
        expect(normalizePriceLevel(true)).toBeUndefined();
        expect(normalizePriceLevel(false)).toBeUndefined();
        expect(normalizePriceLevel({})).toBeUndefined();
        expect(normalizePriceLevel({ price: 2 })).toBeUndefined();
        expect(normalizePriceLevel([])).toBeUndefined();
        expect(normalizePriceLevel([1])).toBeUndefined();
      });

      it('should return undefined for arbitrary non-matching strings', () => {
        expect(normalizePriceLevel('')).toBeUndefined();
        expect(normalizePriceLevel('   ')).toBeUndefined();
        expect(normalizePriceLevel('expensive')).toBeUndefined();
        expect(normalizePriceLevel('cheap')).toBeUndefined();
        expect(normalizePriceLevel('$$invalid')).toBeUndefined();
        expect(normalizePriceLevel('1.5')).toBeUndefined();
      });
    });
  });

  describe('normalizeListingInput integration', () => {
    it('should normalize price_level when given dollar strings', () => {
      const result = normalizeListingInput({
        name: 'Test Restaurant',
        price_level: '$$$',
      });
      expect(result.price_level).toBe(3);
    });

    it('should normalize price_level when given numeric string', () => {
      const result = normalizeListingInput({
        name: 'Test Cafe',
        price_level: '2',
      });
      expect(result.price_level).toBe(2);
    });

    it('should normalize price_level when given number', () => {
      const result = normalizeListingInput({
        name: 'Test Hotel',
        price_level: 4,
      });
      expect(result.price_level).toBe(4);
    });

    it('should omit or leave price_level undefined when given invalid value', () => {
      const result1 = normalizeListingInput({
        name: 'Invalid Price Level Listing',
        price_level: '$$$$$',
      });
      expect(result1.price_level).toBeUndefined();

      const result2 = normalizeListingInput({
        name: 'Invalid Price Level Listing',
        price_level: 0,
      });
      expect(result2.price_level).toBeUndefined();

      const result3 = normalizeListingInput({
        name: 'Invalid Price Level Listing',
        price_level: null,
      });
      expect(result3.price_level).toBeUndefined();

      const result4 = normalizeListingInput({
        name: 'No Price Level Listing',
      });
      expect(result4.price_level).toBeUndefined();
    });
  });

  describe('other schema utilities', () => {
    it('should validate tier photo limits correctly', () => {
      expect(getPhotoLimit('explorer')).toBe(5);
      expect(getPhotoLimit('voyager')).toBe(50);
      expect(getPhotoLimit('signature')).toBe(100);
      expect(getPhotoLimit('partner')).toBe(100);
      expect(getPhotoLimit('unknown')).toBe(5);
      expect(getPhotoLimit(undefined)).toBe(5);

      expect(() =>
        validatePhotoLimit('explorer', ['1', '2', '3', '4', '5']),
      ).not.toThrow();
      expect(() =>
        validatePhotoLimit('explorer', ['1', '2', '3', '4', '5', '6']),
      ).toThrow('Photo limit exceeded for explorer tier: max 5 photos');
    });

    it('should validate UUIDs correctly', () => {
      expect(() =>
        validateUUIDs(['11111111-1111-4111-a111-111111111111']),
      ).not.toThrow();
      expect(() => validateUUIDs(['invalid-uuid'])).toThrow(
        'Invalid UUID: invalid-uuid',
      );
    });

    it('should strip protected fields', () => {
      const input = {
        id: '123',
        name: 'Safe Name',
        is_verified: true,
        base_score: 99,
        custom_field: 'allowed',
      };
      const stripped = stripProtectedFields(input);
      expect(stripped).toEqual({
        name: 'Safe Name',
        custom_field: 'allowed',
      });
    });
  });
});
