import { Booking, UserProfile } from '../../../types/index';

export type EnrichedBooking = Booking & {
    user?: Partial<UserProfile>;
    itemTitle?: string;
};
