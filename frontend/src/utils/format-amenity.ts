/**
 * Formats raw database amenity keys (e.g. "amenities.wifi") into human-friendly labels.
 */
const AMENITY_DICTIONARY: Record<string, string> = {
  'amenities.wifi': 'High-Speed Wi-Fi',
  'amenities.ac': 'Air Conditioning',
  'amenities.kitchen': 'Full Kitchen',
  'amenities.washer': 'Washing Machine',
  'amenities.parking': 'Free Parking',
  'amenities.pool': 'Swimming Pool',
  'amenities.tv': 'Smart TV',
  'amenities.heating': 'Heating System',
  'amenities.essentials': 'Fresh Linens & Essentials',
  'amenities.hot_water': 'Hot Water',
  'amenities.fridge': 'Refrigerator',
  'amenities.dishwasher': 'Dishwasher',
  'amenities.microwave': 'Microwave',
  'amenities.stove': 'Stove & Cooktop',
  'amenities.balcony': 'Patio & Balcony',
  'amenities.bbq': 'BBQ Grill',
  'amenities.private_entrance': 'Private Entrance',
  'amenities.waterfront': 'Seafront / Waterfront',
  'amenities.smoke_alarm': 'Smoke Alarm',
  'amenities.hair_dryer': 'Hair Dryer',
  'amenities.iron': 'Iron & Board',
  'amenities.shampoo': 'Shampoo & Toiletries',
};

export function formatAmenity(rawKey: string): string {
  if (!rawKey || typeof rawKey !== 'string') return '';

  const trimmed = rawKey.trim();
  if (AMENITY_DICTIONARY[trimmed]) {
    return AMENITY_DICTIONARY[trimmed];
  }

  if (trimmed.startsWith('amenities.')) {
    const clean = trimmed.replace(/^amenities\./, '').replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return trimmed;
}
