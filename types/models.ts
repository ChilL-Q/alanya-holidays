import { ApprovalStatus, PropertyType, NotificationType } from './enums';

export interface Amenity {
    icon: string;
    label: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  
  // Manual Payout Details
  iban?: string;
  bank_name?: string;
  bank_account_holder_name?: string;

  created_at?: string;
  role?: 'guest' | 'user' | 'host' | 'admin';
}

export interface PropertyDB {
    id: string;
    property_ref?: number; // Friendly ID (e.g., 1001) - DEPRECATED, use ref_id
    ref_id?: number; // Auto-incrementing friendly ID from database
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

export interface ServiceFeatures {
    brand?: string;
    model?: string;
    year?: string;
    transmission?: string;
    fuel?: string;
    seats?: number;
    vehicleType?: string;
    
    // Adventure fields
    subcategory?: string;
    duration?: string;
    difficulty?: string;
    groupSize?: string;
    included?: string;
    languages?: string;
    requirements?: string;
    itinerary?: any[];

    // Availability
    availableFrom?: string;
    availableTo?: string;
    
    [key: string]: any;
}

export interface ServiceDB {
    id: string;
    service_ref?: number;
    title: string;
    description: string;
    price: number;
    type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer' | 'wellness' | 'creative';
    provider_id: string;
    features: { [key: string]: any };
    images: string[];
    status?: ApprovalStatus | 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
    
    provider?: Partial<UserProfile>;
    created_at?: string;
    is_promoted?: boolean;
    promotion_price?: number;
    promotion_description?: string;
}

export interface ServiceModel {
    id: string;
    type: string;
    brand: string;
    model: string;
    description: string;
    image_url: string;
}

export interface Product {
    id?: string;
    title: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    seller_id: string;
    images: string[];
    
    seller?: Partial<UserProfile>;
    created_at?: string;
}

export interface Review {
    id: string;
    property_id: string;
    user_id: string;
    rating: number; // 1-5
    comment: string;
    images?: string[];
    created_at?: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NotificationType | 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at?: string;
    link?: string;
}

export interface Booking {
    id: string;
    booking_ref?: number;
    user_id: string;
    item_id: string;
    item_type: 'property' | 'service' | 'product';
    check_in?: string;
    check_out?: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    total_price: number;
    created_at?: string;
    
    // Virtual fields for joined data
    property?: Partial<PropertyDB>;
    service?: Partial<ServiceDB>;
    product?: Partial<Product>;
    
    payment_method?: 'card' | 'bank' | 'crypto' | 'cash';
    payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_intent_id?: string;
    
    // Payout fields (Manual Tracking)
    payout_status?: 'pending' | 'processing' | 'paid' | 'failed' | 'hold';
    commission_amount?: number;
    host_payout_amount?: number;
    payout_due_date?: string;
}

export interface Message {
    id?: string;
    name: string;
    email: string;
    subject?: string;
    message: string;
    created_at?: string;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface ChatConversation {
    id: string;
    property_id?: string;
    guest_id: string;
    host_id: string;
    created_at: string;
    updated_at: string;
    
    // Joined data
    property?: {
        title: string;
        images: string[];
    };
    guest?: {
        full_name: string;
        avatar_url: string;
    };
    host?: {
        full_name: string;
        avatar_url: string;
    };
    
    // Computed/Virtual
    last_message?: ChatMessage;
    unread_count?: number;
}

// UI Specific Types (Migrated from index.ts)

export interface Property {
  id: string;
  property_ref?: number;
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
  amenities: (string | any)[];
  hostName: string;
  type?: string; 
  cleaning_fee?: number;
  isPromoted?: boolean;
  promotionPrice?: number;
  promotionDescription?: string;
}

export interface Service {
  id: string;
  type: any; // Using any for transition or Specific enum if imported
  title: string;
  price: number;
  description: string;
  image: string;
  duration?: string; // For tours
  vehicleType?: string; // For transfers
  isPromoted?: boolean;
  promotionPrice?: number;
  promotionDescription?: string;
}

export interface CartItem {
  id: string;
  type: string;
  title: string;
  price: number;
  image?: string;
  details?: string; // e.g., "5 nights" or "Round Trip"
  date?: string;
  startDate?: string;
  endDate?: string;
  guests?: number;
  cleaningFee?: number;
  pricePerNight?: number;
  nights?: number;
}

export interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface DirectoryListingDB {
  id: string;
  category_id: string;
  name: string;
  short_description: string;
  is_featured?: boolean;
  is_verified?: boolean;
  website?: string;
  whatsapp?: string;
  gallery: string[];
  reviews_average?: number;
  reviews_count?: number;
  languages_spoken?: string[];
  certifications?: string[];
  location: string;
  google_map_url?: string;
  price_level?: 1 | 2 | 3 | 4;
  created_at?: string;
  updated_at?: string;
}
