export * from './enums';
export * from './models';

import { ServiceType } from './enums';
import { Amenity } from './models';

// UI Specific Types (Migrated from old types.ts)

export interface Property {
  id: string;
  property_ref?: number;
  ref_id?: number;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  description: string;
  amenities: Amenity[];
  hostName: string;
}

export interface Service {
  id: string;
  type: ServiceType;
  title: string;
  price: number;
  description: string;
  image: string;
  duration?: string; // For tours
  vehicleType?: string; // For transfers
}

export interface CartItem {
  id: string;
  type: ServiceType | string;
  title: string;
  price: number;
  image?: string;
  details?: string; // e.g., "5 nights" or "Round Trip"
  date?: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
}

export interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

// Chat Types are exported from ./models
