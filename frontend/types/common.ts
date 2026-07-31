import { NotificationType } from './enums';
import type { ProfileRow } from '../../shared/types';

export type ListingTier = 'explorer' | 'voyager' | 'signature' | 'partner';

export interface Amenity {
    icon: string;
    label: string;
}

export interface SocialLinks {
    website?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
}

export interface UserProfile extends Omit<Partial<ProfileRow>, 'id' | 'full_name' | 'social_links'> {
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
  crypto_wallet?: string;

  // Social Links
  social_links?: SocialLinks;

  created_at?: string;
  role?: 'guest' | 'user' | 'host' | 'admin';
}

export interface Review {
    id: string;
    property_id: string;
    user_id: string;
    rating: number; // 1-5
    comment: string;
    images?: string[];
    created_at?: string;
    is_flagged?: boolean;
    is_hidden?: boolean;
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
  variant_id?: string;
  variant_label?: string;
}

export interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}
