import { Booking, UserProfile } from '../../../types/index';
import { getBookings, getAdminBookings, getBookingsForHost } from './queries';
import { createBooking, updateBookingStatus, cancelBooking } from './mutations';

export type { BookingCreateInput } from './mutations';

export type EnrichedBooking = Booking & {
    user?: Partial<UserProfile>;
    itemTitle?: string;
};

export const bookingsService = {
    createBooking,
    getBookings,
    getAdminBookings,
    getBookingsByStatus: (status: string) => getAdminBookings(status),
    getBookingsForHost,
    updateBookingStatus,
    cancelBooking,
};
