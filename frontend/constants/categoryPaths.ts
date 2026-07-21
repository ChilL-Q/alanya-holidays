const SCHEMA_TYPE_MAP: Record<string, string> = {
    'accommodations': 'LodgingBusiness',
    'villas':         'LodgingBusiness',
    'apartments':     'LodgingBusiness',
    'restaurants':    'Restaurant',
    'cafes':          'CafeOrCoffeeShop',
    'medical':        'MedicalBusiness',
    'spa-hamam':      'HealthAndBeautyBusiness',
    'hair-beauty':    'HealthAndBeautyBusiness',
    'tours':          'TouristAttraction',
    'transport':      'TaxiService',
};

export function getSchemaType(categoryId: string): string {
    return SCHEMA_TYPE_MAP[categoryId] ?? 'LocalBusiness';
}

export const CATEGORY_PATHS: Record<string, string> = {
    'medical':        '/medical-tourism-alanya',
    'accommodations': '/alanya-hotels',
    'villas':         '/alanya-villas',
    'apartments':     '/alanya-apartments',
    'tours':          '/things-to-do-in-alanya',
    'transport':      '/airport-transfer',
    'restaurants':    '/restaurants',
    'cafes':          '/cafes',
    'real-estate':    '/alanya-real-estate',
    'visa':           '/alanya-residency-guide',
    'shopping':       '/alanya-shopping-guide',
    'nature':         '/alanya-nature-attractions',
    'weather':        '/alanya-weather',
    'nightlife':      '/nightlife',
    'spa-hamam':      '/alanya-spa-hamam',
    'hair-beauty':    '/alanya-hair-beauty',
};

export function getListingUrl(categoryId: string, slug: string): string {
    const prefix = CATEGORY_PATHS[categoryId];
    if (!prefix || !slug) return '/';
    return `${prefix}/${slug}`;
}
