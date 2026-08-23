import { slugify } from '../../utils/slugify';

/**
 * UUID v4 validation regular expression.
 */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates an array of UUIDs and throws an Error if any are malformed.
 */
export function validateUUIDs(ids: string[]): void {
  for (const id of ids) {
    if (!UUID_RE.test(id)) {
      throw new Error(`Invalid UUID: ${id}`);
    }
  }
}

/**
 * Canonical list of protected directory listing fields that cannot be directly
 * set or mutated by untrusted client payloads.
 */
export const PROTECTED_FIELDS = [
  'id',
  'created_at',
  'updated_at',
  'is_verified',
  'is_featured',
  'base_score',
  'subscription_id',
  'listing_locations',
  'owner_user_id',
  'rejection_reason',
] as const;

export type ProtectedField = (typeof PROTECTED_FIELDS)[number];

/**
 * Default unprivileged boolean flags for listings created by standard users.
 */
export const DEFAULT_UNPRIVILEGED_LISTING_FLAGS: Readonly<
  Record<string, boolean>
> = Object.freeze({
  is_featured: false,
  is_verified: false,
  is_premium: false,
});

/**
 * Default fallback photo limit for free or unknown tiers.
 */
export const DEFAULT_PHOTO_LIMIT = 5;

/**
 * Prototype-safe dictionary of tier photo limits.
 * Created with a null prototype to strictly prevent prototype pollution
 * attacks via keys such as '__proto__', 'toString', or 'valueOf'.
 */
const TIER_LIMITS_MAP: Record<string, number> = Object.create(null) as Record<
  string,
  number
>;
TIER_LIMITS_MAP['explorer'] = 5;
TIER_LIMITS_MAP['voyager'] = 50;
TIER_LIMITS_MAP['signature'] = 100;
TIER_LIMITS_MAP['partner'] = 100;
export const TIER_PHOTO_LIMITS: Readonly<Record<string, number>> =
  Object.freeze(TIER_LIMITS_MAP);

/**
 * Returns the maximum photo limit allowed for a given tier.
 * Safely defaults to 5 if the tier is unknown, undefined, or prototype-injected.
 */
export function getPhotoLimit(tier?: unknown): number {
  if (typeof tier === 'string') {
    const normalized = tier.trim().toLowerCase();
    const limit = TIER_PHOTO_LIMITS[normalized];
    if (typeof limit === 'number') {
      return limit;
    }
  }
  return DEFAULT_PHOTO_LIMIT;
}

/**
 * Validates that the gallery array length does not exceed the tier's photo limit.
 * Throws an Error with the exact expected error message when exceeded.
 */
export function validatePhotoLimit(tier?: unknown, gallery?: unknown): void {
  const galleryArray = Array.isArray(gallery) ? gallery : [];
  const limit = getPhotoLimit(tier);
  const tierName =
    typeof tier === 'string' && tier.trim()
      ? tier.trim().toLowerCase()
      : 'explorer';

  if (galleryArray.length > limit) {
    throw new Error(
      `Photo limit exceeded for ${tierName} tier: max ${limit} photos`,
    );
  }
}

/**
 * Strips all protected fields from an input object, returning a clean dictionary.
 */
export function stripProtectedFields<T extends Record<string, unknown>>(
  input: T,
  additionalFields: string[] = [],
): Record<string, unknown> {
  if (!input || typeof input !== 'object') {
    return {};
  }
  const result: Record<string, unknown> = {};
  const fieldsToStrip = new Set<string>([
    ...PROTECTED_FIELDS,
    ...additionalFields,
  ]);

  for (const key of Object.keys(input)) {
    if (!fieldsToStrip.has(key)) {
      result[key] = input[key];
    }
  }
  return result;
}

/**
 * Interface representing sanitized and normalized listing input values.
 */
export interface NormalizedListingInput {
  name: string;
  short_description: string;
  description: string | null;
  category_id: string | null;
  website: string | null;
  whatsapp: string | null;
  location: string;
  google_map_url: string | null;
  video_url: string | null;
  booking_url: string | null;
  gallery: string[];
  tier: string;
  slug?: string;
  price_level?: number | string;
  certifications?: string[];
  languages_spoken?: string[];
  newsletter_featured?: boolean;
  descriptions?: Record<string, unknown>;
}

/**
 * Normalizes, coerces, and truncates raw client listing input to safe bounds.
 */
export function normalizeListingInput(
  input: Record<string, unknown>,
): NormalizedListingInput {
  const tier =
    (typeof input?.tier === 'string' && input.tier.trim()) || 'explorer';
  const gallery = Array.isArray(input?.gallery)
    ? (input.gallery as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      )
    : [];

  const rawName = typeof input?.name === 'string' ? input.name : '';
  const rawShortDesc =
    typeof input?.short_description === 'string'
      ? input.short_description
      : typeof input?.description === 'string'
        ? input.description
        : '';
  const rawDesc =
    typeof input?.description === 'string' ? input.description : null;
  const rawCategory =
    typeof input?.category_id === 'string'
      ? input.category_id
      : typeof input?.category === 'string'
        ? input.category
        : null;
  const rawWebsite =
    typeof input?.website === 'string' ? input.website.slice(0, 500) : null;
  const rawWhatsapp =
    typeof input?.whatsapp === 'string' ? input.whatsapp.slice(0, 50) : null;
  const rawLocation =
    typeof input?.location === 'string'
      ? input.location
      : typeof input?.address === 'string'
        ? input.address
        : '';
  const rawGmap =
    typeof input?.google_map_url === 'string'
      ? input.google_map_url.slice(0, 500)
      : null;
  const rawVideo =
    typeof input?.video_url === 'string' ? input.video_url.slice(0, 500) : null;
  const rawBooking =
    typeof input?.booking_url === 'string'
      ? input.booking_url.slice(0, 500)
      : null;

  const normalized: NormalizedListingInput = {
    name: rawName.trim().slice(0, 200),
    short_description: rawShortDesc.slice(0, 500),
    description: rawDesc,
    category_id: rawCategory,
    website: rawWebsite,
    whatsapp: rawWhatsapp,
    gallery,
    location: rawLocation.slice(0, 200),
    google_map_url: rawGmap,
    video_url: rawVideo,
    booking_url: rawBooking,
    tier,
  };

  if (input?.slug && typeof input.slug === 'string') {
    normalized.slug = slugify(input.slug).slice(0, 200);
  }
  if (
    typeof input?.price_level === 'number' ||
    typeof input?.price_level === 'string'
  ) {
    normalized.price_level = input.price_level;
  }
  if (Array.isArray(input?.certifications)) {
    normalized.certifications = (input.certifications as unknown[]).filter(
      (x): x is string => typeof x === 'string',
    );
  }
  if (Array.isArray(input?.languages_spoken)) {
    normalized.languages_spoken = (input.languages_spoken as unknown[]).filter(
      (x): x is string => typeof x === 'string',
    );
  }
  if (input?.newsletter_featured !== undefined) {
    normalized.newsletter_featured = Boolean(input.newsletter_featured);
  }
  if (
    input?.descriptions &&
    typeof input.descriptions === 'object' &&
    !Array.isArray(input.descriptions)
  ) {
    normalized.descriptions = input.descriptions as Record<string, unknown>;
  }

  return normalized;
}
