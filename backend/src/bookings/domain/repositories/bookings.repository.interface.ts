import { BookingEntity, BookingStatus } from '../entities/booking.entity';
import { StayPeriod } from '../value-objects';

export const BOOKINGS_REPOSITORY = Symbol('IBookingsRepository');

/**
 * Domain Repository Interface for Bookings.
 * Pure interface with zero external framework dependencies.
 */
export interface IBookingsRepository {
  findById(id: string): Promise<BookingEntity | null>;
  findOverlappingBookings(
    itemId: string,
    itemType: string,
    stayPeriod: StayPeriod,
  ): Promise<BookingEntity[]>;
  findByGuestId(guestId: string): Promise<BookingEntity[]>;
  save(booking: BookingEntity): Promise<BookingEntity>;
  updateStatus(id: string, status: BookingStatus): Promise<void>;
}
