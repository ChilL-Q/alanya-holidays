// Split into api/bookings/* — this file re-exports for backward compatibility
export { bookingsService } from './bookings/index';
export type { BookingCreateInput, EnrichedBooking } from './bookings/index';
