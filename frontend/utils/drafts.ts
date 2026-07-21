// Draft storage keys and metadata
export const DRAFT_KEYS = {
  directory_listing: 'draft_directory_listing',
  property_listing: 'draft_property_listing',
  service_listing: 'draft_service_listing',
  admin_directory: (id: string) => `draft_admin_directory_listing_${id}`,
} as const;

export const DRAFT_CONFIG = {
  directory: { label: 'Directory Listing' },
  property: { label: 'Property Listing' },
  service: { label: 'Service Listing' },
  admin_directory: { label: 'Directory Entry' },
} as const;

// Fields to exclude from content checks (config/default values, not user content)
export const EXCLUDE_KEYS = {
  service: ['type', 'vehicleType', 'transmission', 'fuel', 'seats', 'modelSelection', 'difficulty', 'subcategory', 'year'] as const,
  property: ['maxGuests', 'bedrooms', 'beds', 'bathrooms', 'pricePerNight'] as const,
} as const;

// Check if form data has meaningful content (any field beyond metadata has non-empty value)
export function isDraftContentEmpty<T extends Record<string, unknown>>(data: T, excludeKeys: readonly string[] = []): boolean {
  return !Object.entries(data).some(([key, val]) =>
    !excludeKeys.includes(key) && key !== 'updatedAt' && typeof val === 'string' && val.trim().length > 0
  );
}

