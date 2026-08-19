import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export interface ServiceOfferingData {
  id?: string;
  title: string;
  type: string;
  provider_id?: string;
  price?: number;
  currency?: string;
  price_unit?: string;
  capacity?: number;
  location?: string;
  description?: string;
  images?: string[];
  features?: Record<string, unknown>;
  details?: Record<string, unknown>;
  service_ref?: number;
  status?: string;
  rejection_reason?: string | null;
  rating?: number;
  review_count?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
  [key: string]: unknown;
}

export interface ServiceListResponse {
  data: Record<string, unknown>[];
  count: number | null;
}

export interface ServiceEditPayload {
  service_id?: string;
  changed_data?: Record<string, unknown>;
  [key: string]: unknown;
}
