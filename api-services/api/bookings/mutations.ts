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
    const { data, error } = await supabase.rpc('check_booking_conflict', {
        p_item_id: itemId,
        p_item_type: itemType,
        p_check_in: checkIn,
        p_check_out: checkOut
    });

    if (error) {
        console.error('Error checking booking conflicts:', error);
        throw new Error('Failed to validate booking availability');
    }

    return data as BookingConflictResult;
}

export async function createBooking(data: BookingCreateInput) {
    const input = {
        ...data,
        item_type: data.item_type || data.type || 'property'
    };

    const validatedData = bookingSchema.parse(input);

    // Step 1: Check for booking conflicts BEFORE attempting to create
    const { data: conflictResult, error: conflictError } = await supabase.rpc('check_booking_conflict', {
        p_item_id:   validatedData.item_id,
        p_item_type: input.item_type,
        p_check_in:  validatedData.check_in,
        p_check_out: validatedData.check_out
    });

    if (conflictError) {
        console.error('Error checking booking conflicts:', conflictError);
        throw new Error('Failed to validate booking availability');
    }

    if (conflictResult?.has_conflict) {
        throw new Error(conflictResult.message || 'Dates are not available');
    }

    // Step 2: Create the booking (RPC will also perform its own conflict checks as a safety net)
    const rpcParams = {
        p_item_id:        validatedData.item_id,
        p_user_id:        validatedData.user_id,
        p_check_in:       validatedData.check_in,
        p_check_out:      validatedData.check_out,
        p_total_price:    validatedData.total_price,
        p_guests:         validatedData.guests,
        p_message:        validatedData.message,
        p_payment_method: validatedData.payment_method,
        p_item_type:      input.item_type
    };

    const { data: result, error } = await supabase.rpc('create_booking', rpcParams);
    if (error) throw error;
    if (result.error) throw new Error(result.error);

    const bookingId = result.data;
    const itemTypeLabel = input.item_type === 'service' ? 'Service' : 'Property';

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', validatedData.user_id)
        .single();

    const guestName = profile?.full_name || 'Guest';

    await createAuditLog('BOOKING_CREATED', {
        bookingId,
        userId:   validatedData.user_id,
        itemId:   validatedData.item_id,
        itemType: input.item_type
    });

    // Send booking confirmation email to user
    try {
        await retry(() => supabase.functions.invoke('send-email', {
            body: {
                type: 'booking_created',
                userId: validatedData.user_id,
                data: {
                    userName:      guestName,
                    itemTitle:     data.title || 'Item',
                    itemTypeLabel,
                    checkIn:       validatedData.check_in,
                    checkOut:      validatedData.check_out,
                    totalPrice:    validatedData.total_price,
                    guests:        validatedData.guests,
                    link:          getAppUrl('/profile')
                }
            }
        }));
    } catch (err) {
        console.error('Failed to send booking confirmation email:', err);
    }

    // Send notification email to host/provider
    try {
        const table = input.item_type === 'service' ? 'services' : 'properties';
        const ownerColumn = input.item_type === 'service' ? 'provider_id' : 'host_id';

        const { data: itemOwner, error: ownerError } = await supabase
            .from(table)
            .select(`${ownerColumn}, title`)
            .eq('id', validatedData.item_id)
            .single();

        if (ownerError) {
            console.error('Failed to fetch item owner:', ownerError);
        }

        const hostId = itemOwner ? (itemOwner as Record<string, unknown>)[ownerColumn] as string | undefined : null;

        if (hostId) {
            await retry(() => supabase.functions.invoke('send-email', {
                body: {
                    type: 'booking_request_host',
                    userId: hostId,
                    data: {
                        guestName,
                        itemTitle:     itemOwner?.title,
                        itemTypeLabel,
                        checkIn:       validatedData.check_in,
                        checkOut:      validatedData.check_out,
                        totalPrice:    validatedData.total_price,
                        guests:        validatedData.guests,
                        message:       validatedData.message,
                        link:          getAppUrl('/host/bookings')
                    }
                }
            }));
        }
    } catch (err) {
        console.error('Failed to send host notification email:', err);
    }

    return { id: bookingId as string };
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
