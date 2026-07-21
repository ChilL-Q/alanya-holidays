import { supabase } from '../../supabase';
import { bookingSchema } from '../schemas';
import { getAppUrl } from '../../../utils/appUrl';
import { retry } from '../../../utils/retry';
import { createAuditLog } from '../audit';
import { getUserRole } from '../../auth';
import { z } from 'zod';

export type BookingCreateInput = Omit<z.infer<typeof bookingSchema>, 'item_type' | 'payment_method'> & {
    item_type?: 'property' | 'service' | 'product' | string;
    payment_method?: string;
    type?: string;
    title?: string;
    status?: string;
    payment_status?: string;
};

export interface BookingConflictResult {
    has_conflict: boolean;
    conflict_type: string;
    message: string;
    existing_bookings?: number;
}

/**
 * Check for booking conflicts BEFORE attempting to create a booking
 * Call this from the frontend to validate dates before submission
 */
export async function checkBookingConflict(
    itemId: string,
    itemType: string,
    checkIn: string,
    checkOut: string
): Promise<BookingConflictResult> {
    const params = new URLSearchParams({
        itemId,
        itemType,
        checkIn,
        checkOut
    });
    
    const res = await fetch(`/api/bookings/conflict?${params.toString()}`);
    if (!res.ok) {
        throw new Error('Failed to validate booking availability');
    }
    
    return res.json() as Promise<BookingConflictResult>;
}

export async function createBooking(data: BookingCreateInput) {
    const input = {
        ...data,
        item_type: data.item_type || data.type || 'property'
    };

    const validatedData = bookingSchema.parse(input);

    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
    }

    const result = await res.json();
    return { id: result.data };
}

export async function updateBookingStatus(
    id: string,
    status: 'confirmed' | 'cancelled' | 'pending' | 'completed',
    reason?: string
) {
    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: currentBooking } = await supabase
        .from('bookings')
        .select('status, user_id, check_in, check_out, property:properties(title, host_id), service:services(title, provider_id)')
        .eq('id', id)
        .single();

    // Authorization check: user must be booking owner, property host, service provider, or admin
    const isBookingOwner = currentBooking.user_id === user.id;
    const propertyObj = Array.isArray(currentBooking.property) ? currentBooking.property[0] : currentBooking.property;
    const serviceObj = Array.isArray(currentBooking.service) ? currentBooking.service[0] : currentBooking.service;
    const isPropertyHost = propertyObj?.host_id === user.id;
    const isServiceProvider = serviceObj?.provider_id === user.id;
    
    // Use database-based role check instead of client-side user_metadata
    const role = await getUserRole(user.id);
    const isAdmin = role === 'admin';

    if (!isBookingOwner && !isPropertyHost && !isServiceProvider && !isAdmin) {
        throw new Error('Not authorized');
    }

    // Unblock dates BEFORE updating status — if status update fails later,
    // unblocked dates are recoverable; blocked dates on a cancelled booking are not.
    if (status === 'cancelled') {
        try {
            const { error: unblockError } = await supabase.rpc('unblock_dates_for_booking', {
                p_booking_id: id
            });

            if (unblockError) {
                console.error('Failed to unblock dates for cancelled booking:', unblockError);
            }
        } catch (err) {
            console.error('Error calling unblock_dates_for_booking RPC:', err);
        }
    }

    const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

    if (error) throw error;

    if (currentBooking) {
        if (status === 'confirmed') {
            await createAuditLog('BOOKING_CONFIRMED', { bookingId: id }, currentBooking.user_id);
        } else if (status === 'cancelled') {
            const eventType = currentBooking.status === 'pending' ? 'BOOKING_REJECTED' : 'BOOKING_CANCELLED';
            await createAuditLog(eventType, { bookingId: id, reason }, currentBooking.user_id);
        }
    }

    if ((status === 'confirmed' || status === 'cancelled') && currentBooking) {
        const property: { title?: string; host_id?: string } | null = Array.isArray(currentBooking.property) ? currentBooking.property[0] : currentBooking.property;
        const service: { title?: string; provider_id?: string } | null = Array.isArray(currentBooking.service) ? currentBooking.service[0] : currentBooking.service;
        const itemTitle    = property?.title || service?.title || 'Item';
        const hostId       = property?.host_id || service?.provider_id;
        const itemTypeLabel = property ? 'Property' : (service ? 'Service' : 'Item');

        let type: string | null = null;
        if (status === 'confirmed') {
            type = 'booking_confirmed';
        } else if (status === 'cancelled') {
            type = currentBooking.status === 'pending' ? 'booking_rejected' : 'booking_cancelled';
        }

        if (type) {
            try {
                await retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        type,
                        userId: currentBooking.user_id,
                        data: {
                            itemTitle,
                            itemTypeLabel,
                            checkIn:  currentBooking.check_in,
                            checkOut: currentBooking.check_out,
                            reason,
                            link: getAppUrl('/profile')
                        }
                    }
                }));
            } catch (err) {
                console.error('Failed to send status email:', err);
            }

            if (status === 'cancelled' && type === 'booking_cancelled' && hostId) {
                try {
                    await retry(() => supabase.functions.invoke('send-email', {
                        body: {
                            type: 'booking_cancelled_host',
                            userId: hostId,
                            data: {
                                guestName: 'Guest',
                                itemTitle,
                                itemTypeLabel,
                                checkIn:  currentBooking.check_in,
                                checkOut: currentBooking.check_out,
                                link: getAppUrl('/host/bookings')
                            }
                        }
                    }));
                } catch (err) {
                    console.error('Failed to send host cancellation email:', err);
                }
            }
        }
    }
}

export async function cancelBooking(id: string) {
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('created_at, status, user_id')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;
    if (!booking) throw new Error('Booking not found');

    const diffHours = (Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60);
    const reason = diffHours <= 48
        ? 'Free Cancellation (within 48h)'
        : 'Standard Cancellation (after 48h)';

    createAuditLog('CANCELLATION', {
        bookingId: id,
        reason,
        hoursSinceCreation: diffHours.toFixed(2)
    }, booking.user_id);

    return updateBookingStatus(id, 'cancelled', reason);
}

export async function updatePayoutStatus(id: string, payoutStatus: 'paid' | 'pending' | 'processing') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Client-side check for fast rejection. DB trigger (check_payout_status_update) is the authoritative guard.
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    if (!profile || profile.role !== 'admin') {
        throw new Error('Forbidden: admin access required');
    }

    const { error } = await supabase
        .from('bookings')
        .update({ payout_status: payoutStatus })
        .eq('id', id);

    if (error) throw error;

    await createAuditLog('PAYOUT_STATUS_UPDATED', { bookingId: id, payoutStatus }, user.id);
}
