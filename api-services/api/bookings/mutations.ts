import { supabase } from '../../supabase';
import { bookingSchema } from '../schemas';
import { getAppUrl } from '../../../utils/appUrl';
import { retry } from '../../../utils/retry';
import { createAuditLog } from '../audit';
import { z } from 'zod';

export type BookingCreateInput = Omit<z.infer<typeof bookingSchema>, 'item_type' | 'payment_method'> & {
    item_type?: 'property' | 'service' | 'product' | string;
    payment_method?: string;
    type?: string;
    title?: string;
    status?: string;
    payment_status?: string;
};

export async function createBooking(data: BookingCreateInput) {
    const input = {
        ...data,
        item_type: data.item_type || data.type || 'property'
    };

    const validatedData = bookingSchema.parse(input);

    const rpcParams = {
        p_item_id:        validatedData.item_id,
        p_user_id:        validatedData.user_id,
        p_check_in:       validatedData.check_in,
        p_check_out:      validatedData.check_out,
        p_total_price:    validatedData.total_price,
        p_guests:         validatedData.guests,
        p_message:        validatedData.message,
        p_payment_method: validatedData.payment_method,
        p_item_type:      validatedData.item_type
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

    createAuditLog('BOOKING_CREATED', {
        bookingId,
        userId:   validatedData.user_id,
        itemId:   validatedData.item_id,
        itemType: input.item_type
    });

    retry(() => supabase.functions.invoke('send-email', {
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
    })).catch(err => console.error('Failed to send email:', err));

interface ItemOwner { host_id?: string; provider_id?: string; title?: string }
    const table       = input.item_type === 'service' ? 'services' : 'properties';
    const ownerParams = input.item_type === 'service' ? 'provider_id, title' : 'host_id, title';

    supabase.from(table).select(ownerParams).eq('id', validatedData.item_id).single()
        .then(({ data }) => {
            const item = data as ItemOwner;
            const hostId   = item ? (item.host_id || item.provider_id) : null;
            if (hostId) {
                retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        type: 'booking_request_host',
                        userId: hostId,
                        data: {
                            guestName,
                            itemTitle:     item?.title,
                            itemTypeLabel,
                            checkIn:       validatedData.check_in,
                            checkOut:      validatedData.check_out,
                            totalPrice:    validatedData.total_price,
                            guests:        validatedData.guests,
                            message:       validatedData.message,
                            link:          getAppUrl('/host/bookings')
                        }
                    }
                })).catch(err => console.error('Failed to send host email:', err));
            }
        });

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
    const isAdmin = user.user_metadata?.role === 'admin';

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
            createAuditLog('BOOKING_CONFIRMED', { bookingId: id }, currentBooking.user_id);
        } else if (status === 'cancelled') {
            const eventType = currentBooking.status === 'pending' ? 'BOOKING_REJECTED' : 'BOOKING_CANCELLED';
            createAuditLog(eventType, { bookingId: id, reason }, currentBooking.user_id);
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
            retry(() => supabase.functions.invoke('send-email', {
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
            })).catch(err => console.error('Failed to send status email:', err));

            if (status === 'cancelled' && type === 'booking_cancelled' && hostId) {
                retry(() => supabase.functions.invoke('send-email', {
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
                })).catch(err => console.error('Failed to send host cancellation email:', err));
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
