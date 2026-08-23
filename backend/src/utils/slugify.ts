/**
 * Transliteration mappings for Turkish and Cyrillic characters.
 */
const TRANSLITERATION_MAP: Record<string, string> = {
  // Turkish specific characters
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',

  // German, Nordic & European extensions
  ß: 'ss',
  æ: 'ae',
  Æ: 'ae',
  ø: 'o',
  Ø: 'o',
  å: 'a',
  Å: 'a',
  ł: 'l',
  Ł: 'l',
  đ: 'dj',
  Đ: 'dj',

  // Cyrillic transliteration
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  А: 'a',
  Б: 'b',
  В: 'v',
  Г: 'g',
  Д: 'd',
  Е: 'e',
  Ё: 'yo',
  Ж: 'zh',
  З: 'z',
  И: 'i',
  Й: 'y',
  К: 'k',
  Л: 'l',
  М: 'm',
  Н: 'n',
  О: 'o',
  П: 'p',
  Р: 'r',
  С: 's',
  Т: 't',
  У: 'u',
  Ф: 'f',
  Х: 'kh',
  Ц: 'ts',
  Ч: 'ch',
  Ш: 'sh',
  Щ: 'shch',
  Ъ: '',
  Ы: 'y',
  Ь: '',
  Э: 'e',
  Ю: 'yu',
  Я: 'ya',
};

/**
 * Converts a string into a URL-safe slug.
 *
 * - Transliterates Turkish, Cyrillic, and European diacritics
 * - Normalizes Unicode Latin accents (NFD decomposition)
 * - Lowercases the input
 * - Removes quotes and apostrophes
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses multiple hyphens and trims edges
 */
export function slugify(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let result = input;

  // 1. Explicit transliteration mapping
  for (const [from, to] of Object.entries(TRANSLITERATION_MAP)) {
    result = result.split(from).join(to);
  }

  // 2. Unicode NFD normalization (strips accents from latin chars e.g. é -> e, ñ -> n)
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 3. Lowercase
  result = result.toLowerCase();

  // 4. Remove quotes, apostrophes, and backticks
  result = result.replace(/['""`’‘""]/g, '');

  // 5. Replace non-alphanumeric chars with hyphens
  result = result.replace(/[^a-z0-9]+/g, '-');

  // 6. Collapse multiple hyphens and trim
  result = result.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  return result;
}

export type IsSlugTakenFn = (slug: string) => boolean | Promise<boolean>;

/**
 * Generates a unique slug by appending a numeric suffix if the base slug exists.
 * Supports synchronous string array lookups and asynchronous predicate functions (isTakenFn).
 */
export function generateUniqueSlug(
  baseInput: string,
  existingSlugs: string[],
): string;
export function generateUniqueSlug(
  baseInput: string,
  isTakenFn: (slug: string) => Promise<boolean>,
): Promise<string>;
export function generateUniqueSlug(
  baseInput: string,
  isTakenFn: (slug: string) => boolean,
): string;
export function generateUniqueSlug(
  baseInput: string,
  existingOrIsTaken: string[] | IsSlugTakenFn,
): string | Promise<string> {
  const baseSlug = slugify(baseInput) || 'item';

  if (Array.isArray(existingOrIsTaken)) {
    const existingSet = new Set(existingOrIsTaken);
    if (!existingSet.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 1;
    let candidate = `${baseSlug}-${suffix}`;
    while (existingSet.has(candidate)) {
      suffix++;
      candidate = `${baseSlug}-${suffix}`;
    }
    return candidate;
  }

  // Handle predicate function (synchronous or asynchronous)
  const isTakenFn = existingOrIsTaken;
  const initialCheck = isTakenFn(baseSlug);

  if (initialCheck instanceof Promise) {
    return (async () => {
      if (!(await initialCheck)) {
        return baseSlug;
      }

      let suffix = 1;
      let candidate = `${baseSlug}-${suffix}`;
      while (await isTakenFn(candidate)) {
        suffix++;
        candidate = `${baseSlug}-${suffix}`;
      }
      return candidate;
    })();
  }

  if (!initialCheck) {
    return baseSlug;
  }

  let suffix = 1;
  let candidate = `${baseSlug}-${suffix}`;
  while (isTakenFn(candidate)) {
    suffix++;
    candidate = `${baseSlug}-${suffix}`;
  }
  return candidate;
}
