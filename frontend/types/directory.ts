import { ListingTier } from './common';

export interface ListingDescriptions {
  en?: string;
  tr?: string;
  ru?: string;
  ar?: string;
  de?: string;
}

export interface ListingLocationJunction {
  id: string;
  location_id: string;
  display_order: number;
  locations: { id: string; name: string };
}

export interface DirectoryListingDB {
  id: string;
  category_id: string;
  name: string;
  slug?: string;
  short_description: string;
  descriptions?: ListingDescriptions;
  is_featured?: boolean;
  is_premium?: boolean;
  is_verified?: boolean;
  tier?: ListingTier;
  base_score?: number;
  subscription_id?: string;
  website?: string;
  whatsapp?: string;
  gallery: string[];
  reviews_average?: number;
  reviews_count?: number;
  languages_spoken?: string[];
  certifications?: string[];
  location: string;
  google_map_url?: string;
  video_url?: string;
  price_level?: 1 | 2 | 3 | 4;
  newsletter_featured?: boolean;
  net_votes?: number;
  status: 'pending' | 'approved' | 'rejected';
  owner_user_id: string | null;
  rejection_reason: string | null;
  claimed_at?: string;
  created_at?: string;
  updated_at?: string;
  listing_locations?: ListingLocationJunction[];
}

export type DirectoryListingCreateInput = Omit<
  DirectoryListingDB,
  'id' | 'created_at' | 'updated_at' | 'status' | 'owner_user_id' | 'rejection_reason'
>;

export interface ListingClaimDB {
  id: string;
  listing_id: string;
  user_id: string | null;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'marketing' | 'employee' | 'other' | string;
  additional_notes?: string;
  business_name: string;
  contact_phone: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  email_verified: boolean;
  verification_token: string;
  verification_expires_at: string;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LocationDB {
  id: string;
  name: string;
  name_tr?: string;
  lat?: number;
  lng?: number;
  parent_region?: 'Antalya City' | 'Alanya' | 'Other';
  type?: 'city' | 'district' | 'town';
  display_order?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface ListingAnalyticsDaily {
  date: string;
  views: number;
  whatsapp_clicks: number;
  website_clicks: number;
  map_clicks: number;
}

export interface ListingAnalyticsSummary {
  listing_id: string;
  listing_name: string;
  listing_category_id: string;
  total_views: number;
  total_whatsapp_clicks: number;
  total_website_clicks: number;
  total_map_clicks: number;
  daily_data: ListingAnalyticsDaily[];
}

export type AddonType =
  | 'instant_booking'
  | 'verified_badge'
  | 'seasonal_placement'
  | 'sponsored_article'
  | 'ai_localization';

export type AddonStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface ListingAddon {
  id: string;
  listing_id: string;
  addon_type: AddonType;
  status: AddonStatus;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  starts_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CategoryAnalyticsAverage {
  avg_views: number;
  avg_whatsapp_clicks: number;
  avg_website_clicks: number;
  avg_map_clicks: number;
  listing_count: number;
}

export interface ListingReview {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: { full_name: string | null; avatar_url: string | null };
}
