import { getBookings, getAdminBookings, getBookingsForHost } from './queries';

import { createBooking, updateBookingStatus, updatePayoutStatus, cancelBooking, checkBookingConflict } from './mutations';

export type { BookingCreateInput } from './mutations';
export type { BookingConflictResult } from './mutations';

export type { EnrichedBooking } from './types';

export const bookingsService = {
    createBooking,
    checkBookingConflict,
    getBookings,
    getAdminBookings,
    getBookingsByStatus: (status: string) => getAdminBookings(status),
    getBookingsForHost,
    updateBookingStatus,
    updatePayoutStatus,
    cancelBooking,
};
