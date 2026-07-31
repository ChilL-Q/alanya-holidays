import { ApprovalStatus, PropertyType } from './enums';
import { UserProfile } from './common';

export interface PropertyDB {
    id: string;
    ref_id?: number;
    title: string;
    description: string;
    price_per_night: number;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    type: PropertyType | 'villa' | 'apartment'; // Support both for transition
    amenities: string[];
    images: string[];
    host_id: string;
    rental_license?: string;
    status?: ApprovalStatus | 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
    cleaning_fee?: number;
    
    // Hospitality Details
    arrival_guide?: string;
    check_in_time?: string;
    check_out_time?: string;
    directions?: string;
    check_in_method?: string;
    wifi_details?: string;
    house_manual?: string;
    house_rules?: string;
    checkout_instructions?: string;
    guidebooks?: string;
    interaction_preferences?: string;
    
    max_guests?: number;
    beds?: number;
    bathrooms: number;
    bedrooms: number;
    rating?: number;
    reviews_count?: number;
    reviews?: Array<{ count: number }>;

    host?: Partial<UserProfile>;
    created_at?: string;
    updated_at?: string;
    is_promoted?: boolean;
    promotion_price?: number;
    promotion_description?: string;
    
    // iCal & Sync
    ical_url?: string;
    ical_token?: string;
    last_synced_at?: string;

    // Legacy Supabase join field
    profiles?: { full_name?: string; username?: string; avatar_url?: string };
}

export interface PropertyICalFeed {
    id: string;
    property_id: string;
    name: string;
    url: string;
    last_synced_at?: string;
    created_at?: string;
}

export interface PropertyAvailability {
    id: string;
    property_id: string;
    date: string;
    status: 'available' | 'booked' | 'blocked';
    price?: number;
    source: 'manual' | 'ical' | 'reservation';
    feed_id?: string;
    feed?: {
        name: string;
    };
    external_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface PropertyFormData {
    title?: string;
    description?: string;
    type?: string;
    propertyType?: 'villa' | 'apartment' | string;
    price?: string | number;
    maxGuests?: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    address?: string;
    location?: string;
    latitude?: number | null;
    longitude?: number | null;
    rentalLicense?: string;
    pricePerNight?: number | string;
    cleaningFee?: number | string;
    securityDeposit?: number | string;
    weekendPremium?: number | string;
    minStay?: number | string;
    amenities?: string[];
    hospitality?: {
        airportPickup: boolean;
        groceryDelivery: boolean;
        dailyCleaning: boolean;
        welcomeBasket: boolean;
    };
    images?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    checkInMethod?: string;
    wifiDetails?: string;
    arrivalGuide?: string;
    houseManual?: string;
    houseRules?: string;
    checkoutInstructions?: string;
    guidebooks?: string;
    interactionPreferences?: string;
    icalUrl?: string;
    promotionPrice?: number;
    promotionDescription?: string;
}

export interface Property {
  id: string;
  ref_id?: number;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
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
  amenities: string[];
  hostName: string;
  type?: string; 
  cleaning_fee?: number;
  isPromoted?: boolean;
  promotionPrice?: number;
  promotionDescription?: string;
}
