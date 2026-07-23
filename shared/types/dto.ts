import type { Database } from './database.types.js';

// Alias raw database rows
export type PropertyRow = Database['public']['Tables']['properties']['Row'];
export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export type BookingRow = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

export type DirectoryListingRow = Database['public']['Tables']['directory_listings']['Row'];
export type DirectoryListingInsert = Database['public']['Tables']['directory_listings']['Insert'];

export type ForumPostRow = Database['public']['Tables']['forum_posts']['Row'];
export type ForumPostInsert = Database['public']['Tables']['forum_posts']['Insert'];

// Common API Response Wrappers
export interface ApiResponse<T> {
  data: T | null;
  error?: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
