export interface PropertySummaryRow {
  id: string;
  title: string;
  images?: string[] | null;
  price_per_night?: number | null;
  location?: string | null;
  host_id?: string | null;
  [key: string]: unknown;
}

export interface ServiceSummaryRow {
  id: string;
  title: string;
  images?: string[] | null;
  price?: number | null;
  type?: string | null;
  provider_id?: string | null;
  [key: string]: unknown;
}

export interface ProfileSummaryRow {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  [key: string]: unknown;
}

export interface EnrichedBookingRow {
  id: string;
  user_id?: string | null;
  item_id?: string | null;
  property_id?: string | null;
  service_id?: string | null;
  item_type?: string | null;
  status?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  total_price?: number | null;
  guests?: number | null;
  message?: string | null;
  property?: PropertySummaryRow | null;
  service?: ServiceSummaryRow | null;
  user?: ProfileSummaryRow | null;
  itemTitle?: string;
  [key: string]: unknown;
}
