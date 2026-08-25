export type {
  DirectoryListingRecord,
  DirectoryListResponse,
} from '@alanya-holidays/shared/directory';

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
  directory_listing?: {
    id: string;
    name?: string;
    slug?: string;
    category_id?: string;
    gallery?: string[];
    tier?: string;
    status?: string;
    location?: string;
  } | null;
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
