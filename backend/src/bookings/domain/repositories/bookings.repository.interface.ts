import { BookingEntity, BookingStatus } from '../entities/booking.entity';
import { StayPeriod } from '../value-objects';

export const BOOKINGS_REPOSITORY = Symbol('IBookingsRepository');

export interface BookingTransitionResult {
  id: string;
  oldStatus: BookingStatus;
  newStatus: BookingStatus;
  unblockedDatesCount: number;
  itemId: string;
  itemType: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
}

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
  transitionStatus(params: {
    bookingId: string;
    newStatus: BookingStatus;
    userId?: string;
    reason?: string;
    paymentStatus?: string;
  }): Promise<BookingTransitionResult>;
}
