export interface ConfirmedBookingDetails {
  id?: string;
  status?: string;
  payment_status?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  property?: { title?: string } | null;
  service?: { title?: string } | null;
  profile?: { email?: string } | null;
}
