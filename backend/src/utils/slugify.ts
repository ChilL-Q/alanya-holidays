/**
 * Converts a string into a URL-safe slug.
 *
 * - Lowercases the input
 * - Replaces non-ASCII chars with ASCII approximations (Turkish-aware)
 * - Replaces spaces/special chars with hyphens
 * - Collapses multiple hyphens into one
 * - Trims leading/trailing hyphens
 */
export function slugify(input: string): string {
  if (!input) return '';

  const turkishMap: Record<string, string> = {
    ç: 'c',
    Ç: 'C',
    ğ: 'g',
    Ğ: 'G',
    ı: 'i',
    İ: 'I',
    ö: 'o',
    Ö: 'O',
    ş: 's',
    Ş: 'S',
    ü: 'u',
    Ü: 'U',
  };

  let result = input;

  // Replace Turkish characters
  for (const [from, to] of Object.entries(turkishMap)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }

  result = result.toLowerCase();

  // Replace apostrophes and quotes (remove them)
  result = result.replace(/['"""]/g, '');

  // Replace spaces and non-alphanumeric chars with hyphens
  result = result.replace(/[^a-z0-9]+/g, '-');

  // Collapse multiple hyphens and trim
  result = result.replace(/-+/g, '-').replace(/^-|-$/g, '');

  return result;
}

/**
 * Generates a unique slug by appending a numeric suffix if the base slug exists.
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let suffix = 1;
  let candidate = `${baseSlug}-${suffix}`;
  while (existingSlugs.includes(candidate)) {
    suffix++;
    candidate = `${baseSlug}-${suffix}`;
  }
  return candidate;
}
