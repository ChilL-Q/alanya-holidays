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
  role?: 'user' | 'host' | 'admin' | 'guest';
  created_at?: string;
}

export interface PropertyDB {
    id: string;
    title: string;
    description: string;
    price_per_night: number;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    type: PropertyType | 'villa' | 'apartment'; // Support both for transition
    amenities: Amenity[];
    images: string[];
    host_id: string;
    ical_url?: string;
    rental_license?: string;
    status?: ApprovalStatus | 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
    
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
    
    [key: string]: any;
}

export interface ServiceDB {
    id: string;
    title: string;
    description: string;
    price: number;
    type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer';
    provider_id: string;
    features: ServiceFeatures;
    images: string[];
    status?: ApprovalStatus | 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
    
    provider?: Partial<UserProfile>;
    created_at?: string;
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
    artisan_id: string;
    images: string[];
    
    artisan?: Partial<UserProfile>;
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
}

export interface Message {
    id?: string;
    name: string;
    email: string;
    message: string;
    created_at?: string;
}
