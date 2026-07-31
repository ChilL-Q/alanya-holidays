import { ApprovalStatus } from './enums';
import { UserProfile } from './common';

export interface ServiceFeatures {
    brand?: string;
    model?: string;
    year?: string;
    transmission?: string;
    fuel?: string;
    seats?: number | string;
    vehicleType?: string;

    // Adventure fields
    subcategory?: string;
    duration?: string;
    difficulty?: string;
    groupSize?: string;
    included?: string;
    languages?: string;
    requirements?: string;
    itinerary?: Array<{ label?: string; value?: string; description?: string; duration?: string }>;

    // Availability
    availableFrom?: string;
    availableTo?: string;

    // Booking/contact
    whatsapp?: string;
}

export interface ServiceDB {
    id: string;
    service_ref?: number;
    title: string;
    description: string;
    price: number;
    type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer' | 'wellness' | 'creative';
    provider_id: string;
    features: ServiceFeatures;
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

export interface Service {
  id: string;
  type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer' | 'wellness' | 'creative';
  title: string;
  price: number;
  description: string;
  image: string;
  duration?: string;
  vehicleType?: string;
  brand?: string;
  subcategory?: 'rental' | 'transfer';
  isPromoted?: boolean;
  promotionPrice?: number;
  promotionDescription?: string;
}
