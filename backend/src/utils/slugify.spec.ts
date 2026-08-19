import { slugify, generateUniqueSlug } from './slugify';

describe('slugify utils', () => {
  describe('slugify', () => {
    it('should return an empty string for empty or falsy inputs', () => {
      expect(slugify('')).toBe('');
      expect(slugify(null as unknown as string)).toBe('');
      expect(slugify(undefined as unknown as string)).toBe('');
    });

    it('should convert text to lowercase and replace spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Alanya Holidays Web App')).toBe(
        'alanya-holidays-web-app',
      );
    });

    it('should correctly transform Turkish characters into ASCII approximations', () => {
      expect(slugify('İstanbul Çeşme Niğde Ölüdeniz Şile Ürgüp')).toBe(
        'istanbul-cesme-nigde-oludeniz-sile-urgup',
      );
      expect(slugify('çÇğĞıİöÖşŞüÜ')).toBe('ccggiioossuu');
    });

    it('should remove quotes, apostrophes, and special characters', () => {
      expect(slugify("Alanya's Best Beach!")).toBe('alanyas-best-beach');
      expect(slugify('Tour #1: "Luxury Villa" & Boat (2026)')).toBe(
        'tour-1-luxury-villa-boat-2026',
      );
    });

    it('should collapse multiple hyphens and trim leading/trailing hyphens', () => {
      expect(slugify('---Hello---World---')).toBe('hello-world');
      expect(slugify('  Space   And   Hyphen - - Test  ')).toBe(
        'space-and-hyphen-test',
      );
    });
  });

  describe('generateUniqueSlug', () => {
    it('should return base slug if not in existing slugs', () => {
      expect(generateUniqueSlug('my-post', ['other-post'])).toBe('my-post');
      expect(generateUniqueSlug('alanya-tour', [])).toBe('alanya-tour');
    });

    it('should append numeric suffix if base slug exists', () => {
      expect(generateUniqueSlug('my-post', ['my-post'])).toBe('my-post-1');
    });

    it('should increment numeric suffix until a unique slug is found', () => {
      const existing = ['my-post', 'my-post-1', 'my-post-2'];
      expect(generateUniqueSlug('my-post', existing)).toBe('my-post-3');
    });
  });
});
