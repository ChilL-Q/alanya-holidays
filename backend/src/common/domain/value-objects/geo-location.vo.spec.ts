import { GeoLocation } from './geo-location.vo';

describe('GeoLocation Value Object', () => {
  const alanyaCenter = {
    lat: 36.54375,
    lng: 31.99982,
    district: 'Alanya Center',
    address: 'Ataturk Cad. No: 1',
  };
  const antalyaCenter = {
    lat: 36.88414,
    lng: 30.70563,
  };

  describe('Creation and Validation', () => {
    it('should create a valid GeoLocation instance with latitude and longitude', () => {
      const location = new GeoLocation(alanyaCenter.lat, alanyaCenter.lng);
      expect(location.latitude).toBe(alanyaCenter.lat);
      expect(location.longitude).toBe(alanyaCenter.lng);
      expect(location.district).toBeUndefined();
      expect(location.address).toBeUndefined();
    });

    it('should create a valid GeoLocation instance with district and address', () => {
      const location = new GeoLocation(
        alanyaCenter.lat,
        alanyaCenter.lng,
        alanyaCenter.district,
        alanyaCenter.address,
      );
      expect(location.latitude).toBe(alanyaCenter.lat);
      expect(location.longitude).toBe(alanyaCenter.lng);
      expect(location.district).toBe('Alanya Center');
      expect(location.address).toBe('Ataturk Cad. No: 1');
    });

    it('should allow boundary values (-90, 90 for lat and -180, 180 for lng)', () => {
      const minBounds = new GeoLocation(-90, -180);
      expect(minBounds.latitude).toBe(-90);
      expect(minBounds.longitude).toBe(-180);

      const maxBounds = new GeoLocation(90, 180);
      expect(maxBounds.latitude).toBe(90);
      expect(maxBounds.longitude).toBe(180);
    });

    it('should throw an error for invalid latitude', () => {
      expect(() => new GeoLocation(-90.1, 0)).toThrow(
        'Invalid latitude: must be a number between -90 and 90',
      );
      expect(() => new GeoLocation(90.1, 0)).toThrow(
        'Invalid latitude: must be a number between -90 and 90',
      );
      expect(() => new GeoLocation(NaN, 0)).toThrow(
        'Invalid latitude: must be a number between -90 and 90',
      );
      expect(() => new GeoLocation(Infinity, 0)).toThrow(
        'Invalid latitude: must be a number between -90 and 90',
      );
    });

    it('should throw an error for invalid longitude', () => {
      expect(() => new GeoLocation(0, -180.1)).toThrow(
        'Invalid longitude: must be a number between -180 and 180',
      );
      expect(() => new GeoLocation(0, 180.1)).toThrow(
        'Invalid longitude: must be a number between -180 and 180',
      );
      expect(() => new GeoLocation(0, NaN)).toThrow(
        'Invalid longitude: must be a number between -180 and 180',
      );
      expect(() => new GeoLocation(0, Infinity)).toThrow(
        'Invalid longitude: must be a number between -180 and 180',
      );
    });
  });

  describe('equals()', () => {
    it('should return true for locations with same coordinates', () => {
      const a = new GeoLocation(36.54375, 31.99982);
      const b = new GeoLocation(36.54375, 31.99982);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for locations with different coordinates', () => {
      const a = new GeoLocation(36.54375, 31.99982);
      const b = new GeoLocation(36.88414, 30.70563);
      expect(a.equals(b)).toBe(false);
    });

    it('should return false when comparing against null/undefined', () => {
      const a = new GeoLocation(36.54375, 31.99982);
      expect(a.equals(null as unknown as GeoLocation)).toBe(false);
      expect(a.equals(undefined as unknown as GeoLocation)).toBe(false);
    });
  });

  describe('distanceTo()', () => {
    it('should return 0 distance to itself', () => {
      const loc = new GeoLocation(alanyaCenter.lat, alanyaCenter.lng);
      expect(loc.distanceTo(loc)).toBe(0);
    });

    it('should calculate accurate distance between Alanya and Antalya in km', () => {
      const alanya = new GeoLocation(alanyaCenter.lat, alanyaCenter.lng);
      const antalya = new GeoLocation(antalyaCenter.lat, antalyaCenter.lng);

      const distanceKm = alanya.distanceTo(antalya);
      // Great-circle distance between Alanya and Antalya is ~121 km
      expect(distanceKm).toBeGreaterThan(115);
      expect(distanceKm).toBeLessThan(130);
    });

    it('should calculate distance in meters when requested', () => {
      const alanya = new GeoLocation(alanyaCenter.lat, alanyaCenter.lng);
      const antalya = new GeoLocation(antalyaCenter.lat, antalyaCenter.lng);

      const distanceM = alanya.distanceTo(antalya, 'm');
      expect(distanceM).toBeGreaterThan(115000);
      expect(distanceM).toBeLessThan(130000);
    });
  });

  describe('format()', () => {
    it('should format coordinates when district is not present', () => {
      const loc = new GeoLocation(36.54375, 31.99982);
      expect(loc.format()).toBe('36.543750, 31.999820');
    });

    it('should include district and address when present', () => {
      const loc = new GeoLocation(
        36.54375,
        31.99982,
        'Mahmutlar',
        'Barbaros Cad.',
      );
      expect(loc.format()).toBe(
        'Mahmutlar, Barbaros Cad. (36.543750, 31.999820)',
      );
    });
  });

  describe('static fromCoordinates() factory', () => {
    it('should create GeoLocation via factory method', () => {
      const loc = GeoLocation.fromCoordinates(36.54375, 31.99982, 'Oba');
      expect(loc).toBeInstanceOf(GeoLocation);
      expect(loc.latitude).toBe(36.54375);
      expect(loc.longitude).toBe(31.99982);
      expect(loc.district).toBe('Oba');
    });
  });
});
