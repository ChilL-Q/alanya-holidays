/**
 * Каноническая форма District Directory listing.
 *
 * Единственный владелец контракта между backend (Nest serializer →
 * repository select) и frontend (mapper). Одно имя на одно поле:
 * alias-толерантность допустима только на ВХОДЕ (форма Host), не на выходе.
 */
export interface DirectoryListingRecord {
  id: string;
  name?: string;
  title?: string | null;
  short_description?: string;
  description?: string | null;
  category_id?: string;
  category?: string | null;
  subcategory?: string;
  website?: string | null;
  whatsapp?: string | null;
  gallery?: string[];
  location?: string | null;
  address?: string | null;
  google_map_url?: string | null;
  video_url?: string | null;
  booking_url?: string | null;
  phone?: string | null;
  email?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
  is_premium?: boolean;
  tier?:
    | 'explorer'
    | 'voyager'
    | 'signature'
    | 'partner'
    | (string & {});
  base_score?: number;
  descriptions?: Record<string, unknown>;
  status?:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | (string & {});
  owner_user_id?: string | null;
  owner_id?: string | null;
  rejection_reason?: string | null;
  slug?: string | null;
  price_level?: number | string;
  certifications?: string[];
  languages_spoken?: string[];
  newsletter_featured?: boolean;
  claimed_at?: string | null;
  creation_source?: 'admin' | 'merchant' | 'import';
  can_claim?: boolean;
  subscription_id?: string | null;
  listing_locations?: unknown;
  google_rating?: number | null;
  google_review_count?: number | null;
  reviews_average?: number | null;
  reviews_count?: number;
  net_votes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DirectoryListResponse {
  data: DirectoryListingRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
