/**
 * GeoLocation Value Object
 * Represents an immutable geographic location coordinate with optional district/address metadata.
 * Zero external framework dependencies.
 */
export class GeoLocation {
  private readonly _latitude: number;
  private readonly _longitude: number;
  private readonly _district?: string;
  private readonly _address?: string;

  constructor(
    latitude: number,
    longitude: number,
    district?: string,
    address?: string,
  ) {
    if (
      typeof latitude !== 'number' ||
      isNaN(latitude) ||
      !isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error('Invalid latitude: must be a number between -90 and 90');
    }

    if (
      typeof longitude !== 'number' ||
      isNaN(longitude) ||
      !isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        'Invalid longitude: must be a number between -180 and 180',
      );
    }

    this._latitude = latitude;
    this._longitude = longitude;
    this._district = district?.trim() || undefined;
    this._address = address?.trim() || undefined;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  get district(): string | undefined {
    return this._district;
  }

  get address(): string | undefined {
    return this._address;
  }

  /**
   * Calculates great-circle distance between this location and another using the Haversine formula.
   *
   * @param other Target GeoLocation
   * @param unit Unit of measurement ('km' | 'm'), default is 'km'
   * @returns Distance in specified unit
   */
  distanceTo(other: GeoLocation, unit: 'km' | 'm' = 'km'): number {
    if (
      !other ||
      typeof other.latitude !== 'number' ||
      typeof other.longitude !== 'number'
    ) {
      throw new Error('Invalid target location for distance calculation');
    }

    if (
      this._latitude === other.latitude &&
      this._longitude === other.longitude
    ) {
      return 0;
    }

    const toRad = (degrees: number) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRad(other.latitude - this._latitude);
    const dLon = toRad(other.longitude - this._longitude);

    const lat1 = toRad(this._latitude);
    const lat2 = toRad(other.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = earthRadiusKm * c;

    if (unit === 'm') {
      return Math.round(distanceKm * 1000 * 100) / 100;
    }

    return Math.round(distanceKm * 100) / 100;
  }

  /**
   * Checks value equality between two GeoLocation instances.
   */
  equals(other: GeoLocation): boolean {
    if (
      !other ||
      typeof other.latitude !== 'number' ||
      typeof other.longitude !== 'number'
    ) {
      return false;
    }

    const coordsEqual =
      Math.abs(this._latitude - other.latitude) < 1e-7 &&
      Math.abs(this._longitude - other.longitude) < 1e-7;

    return coordsEqual;
  }

  /**
   * Formats the location as a readable string.
   */
  format(): string {
    const coords = `${this._latitude.toFixed(6)}, ${this._longitude.toFixed(6)}`;
    const locationParts = [this._district, this._address].filter(Boolean);

    if (locationParts.length > 0) {
      return `${locationParts.join(', ')} (${coords})`;
    }

    return coords;
  }

  /**
   * Factory method to create a GeoLocation instance.
   */
  static fromCoordinates(
    latitude: number,
    longitude: number,
    district?: string,
    address?: string,
  ): GeoLocation {
    return new GeoLocation(latitude, longitude, district, address);
  }
}
