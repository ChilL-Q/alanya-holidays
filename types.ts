export enum ServiceType {
  TRANSFER = 'TRANSFER',
  TOUR = 'TOUR',
  RENTAL = 'RENTAL',
  PRODUCT = 'PRODUCT',
  OTHER = 'OTHER'
}

export interface Amenity {
  icon: string;
  label: string;
}

export interface Property {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  guests: number;
  bedrooms: number;
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
  type: ServiceType;
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