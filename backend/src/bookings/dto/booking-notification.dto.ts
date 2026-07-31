export interface ConfirmedBookingDetails {
  check_in?: string;
  check_out?: string;
  guests?: number;
  property?: { title?: string };
  service?: { title?: string };
  profile?: { email?: string };
}
