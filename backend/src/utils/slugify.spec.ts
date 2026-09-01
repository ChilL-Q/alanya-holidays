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
      expect(slugify('Alanya Şehir Rehberi')).toBe('alanya-sehir-rehberi');
    });

    it('should normalize international Latin diacritics and accents', () => {
      expect(slugify('Café & Crème Brûlée in Málaga')).toBe(
        'cafe-creme-brulee-in-malaga',
      );
      expect(slugify('São Paulo & Kraków Naïve')).toBe(
        'sao-paulo-krakow-naive',
      );
    });

    it('should transliterate Cyrillic characters into Latin approximations', () => {
      expect(slugify('Экскурсии в Аланье')).toBe('ekskursii-v-alane');
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

    it('should return an empty string for non-string inputs', () => {
      expect(slugify(123 as unknown as string)).toBe('');
      expect(slugify({} as unknown as string)).toBe('');
      expect(slugify([] as unknown as string)).toBe('');
    });

    it('should transliterate European diacritics (German, Nordic, Slavic)', () => {
      expect(slugify('Straße & Groß in München')).toBe(
        'strasse-gross-in-munchen',
      );
      expect(slugify('København & Ålesund Blåbær')).toBe(
        'kobenhavn-alesund-blabaer',
      );
      expect(slugify('Łódź & Đakovo')).toBe('lodz-djakovo');
    });

    it('should handle pure emojis or non-alphanumeric input safely', () => {
      expect(slugify('🚀✨🎉')).toBe('');
      expect(slugify('??? !!!')).toBe('');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should fallback to "item" for empty or emoji-only inputs', () => {
      expect(generateUniqueSlug('', [])).toBe('item');
      expect(generateUniqueSlug('🚀✨', [])).toBe('item');
      expect(generateUniqueSlug('🚀✨', ['item'])).toBe('item-1');
    });

    describe('synchronous array collision resolution', () => {
      it('should return base slug if not in existing slugs', () => {
        expect(generateUniqueSlug('my-post', ['other-post'])).toBe('my-post');
        expect(generateUniqueSlug('alanya-tour', [])).toBe('alanya-tour');
      });

      it('should slugify unslugified title input when checking against existing slugs', () => {
        expect(generateUniqueSlug('İstanbul Çeşme', ['istanbul-cesme'])).toBe(
          'istanbul-cesme-1',
        );
      });

      it('should append numeric suffix if base slug exists', () => {
        expect(generateUniqueSlug('my-post', ['my-post'])).toBe('my-post-1');
      });

      it('should increment numeric suffix until a unique slug is found', () => {
        const existing = ['my-post', 'my-post-1', 'my-post-2'];
        expect(generateUniqueSlug('my-post', existing)).toBe('my-post-3');
      });
    });

    describe('synchronous boolean isTakenFn predicate', () => {
      it('should support synchronous isTakenFn function', () => {
        const takenSet = new Set(['hotel-alanya', 'hotel-alanya-1']);
        const isTakenSync = (candidate: string) => takenSet.has(candidate);

        const result = generateUniqueSlug('Hotel Alanya', isTakenSync);
        expect(result).toBe('hotel-alanya-2');
      });
    });

    describe('asynchronous isTakenFn collision resolution', () => {
      it('should return base slug immediately if isTakenFn returns false', async () => {
        const isTakenFn = jest.fn().mockResolvedValue(false);
        const result = await generateUniqueSlug('Alanya Castle', isTakenFn);

        expect(result).toBe('alanya-castle');
        expect(isTakenFn).toHaveBeenCalledWith('alanya-castle');
        expect(isTakenFn).toHaveBeenCalledTimes(1);
      });

      it('should query isTakenFn until an available candidate slug is found', async () => {
        const takenSlugs = new Set([
          'alanya-castle',
          'alanya-castle-1',
          'alanya-castle-2',
        ]);
        const isTakenFn = jest.fn().mockImplementation((candidate: string) => {
          return Promise.resolve(takenSlugs.has(candidate));
        });

        const result = await generateUniqueSlug('Alanya Castle', isTakenFn);

        expect(result).toBe('alanya-castle-3');
        expect(isTakenFn).toHaveBeenCalledWith('alanya-castle');
        expect(isTakenFn).toHaveBeenCalledWith('alanya-castle-1');
        expect(isTakenFn).toHaveBeenCalledWith('alanya-castle-2');
        expect(isTakenFn).toHaveBeenCalledWith('alanya-castle-3');
      });
    });
  });
});
