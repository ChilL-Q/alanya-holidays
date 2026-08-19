import { describe, it, expect } from 'vitest';
import { formatAmenity } from './format-amenity';

describe('formatAmenity', () => {
  it('translates known database amenity keys into readable English labels', () => {
    expect(formatAmenity('amenities.wifi')).toBe('High-Speed Wi-Fi');
    expect(formatAmenity('amenities.ac')).toBe('Air Conditioning');
    expect(formatAmenity('amenities.pool')).toBe('Swimming Pool');
    expect(formatAmenity('amenities.kitchen')).toBe('Full Kitchen');
    expect(formatAmenity('amenities.waterfront')).toBe('Seafront / Waterfront');
    expect(formatAmenity('amenities.bbq')).toBe('BBQ Grill');
  });

  it('gracefully formats unknown amenity keys with prefix', () => {
    expect(formatAmenity('amenities.custom_sauna')).toBe('Custom sauna');
  });

  it('leaves already formatted labels unchanged', () => {
    expect(formatAmenity('Private Chef')).toBe('Private Chef');
    expect(formatAmenity('')).toBe('');
  });
});
