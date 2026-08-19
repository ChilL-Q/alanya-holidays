import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  [key: string]: unknown;
}

export interface DirectoryListingRecord {
  id: string;
  name?: string;
  title?: string | null;
  short_description?: string;
  description?: string | null;
  category_id?: string;
  category?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  gallery?: string[];
  location?: string | null;
  google_map_url?: string | null;
  video_url?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
  is_premium?: boolean;
  tier?: 'explorer' | 'voyager' | 'signature' | 'partner' | (string & {});
  base_score?: number;
  descriptions?: Record<string, unknown>;
  status?: 'pending' | 'approved' | 'rejected' | (string & {});
  owner_user_id?: string | null;
  owner_id?: string | null;
  rejection_reason?: string | null;
  slug?: string | null;
  price_level?: number;
  certifications?: string[];
  languages_spoken?: string[];
  newsletter_featured?: boolean;
  claimed_at?: string | null;
  subscription_id?: string | null;
  listing_locations?: unknown;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
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

export interface DirectoryClaimRecord {
  id: string;
  listing_id: string;
  user_id: string;
  email: string;
  phone: string;
  role: string;
  business_name: string;
  contact_phone: string;
  additional_notes?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  description?: string | null;
  status: string;
  verification_token?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface VoteResult {
  net_votes: number;
  user_vote?: number;
}

export interface ClaimRpcResult {
  success?: boolean;
  message?: string;
}
