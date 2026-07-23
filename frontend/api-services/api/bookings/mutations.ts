import { supabase } from '../../supabase';
import { bookingSchema } from '../schemas';
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

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function checkBookingConflict(
    itemId: string,
    itemType: string,
    checkIn: string,
    checkOut: string
): Promise<BookingConflictResult> {
    const params = new URLSearchParams({ itemId, itemType, checkIn, checkOut });
    const res = await fetch(`/api/bookings/conflict?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to validate booking availability');
    return res.json() as Promise<BookingConflictResult>;
}

export async function createBooking(data: BookingCreateInput) {
    const input = { ...data, item_type: data.item_type || data.type || 'property' };
    const validatedData = bookingSchema.parse(input);
    const headers = await getAuthHeaders();

    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create booking');
    }

    const text = await res.text();
    let result: unknown;
    try {
        result = JSON.parse(text);
    } catch {
        result = text;
    }

    let bookingId: unknown;
    if (typeof result === 'string') {
        bookingId = result;
    } else if (typeof result === 'object' && result !== null) {
        const obj = result as Record<string, unknown>;
        bookingId = obj.id ?? obj.data ?? result;
    } else {
        bookingId = result;
    }
    return { id: bookingId as string };
}

export async function updateBookingStatus(
    id: string,
    status: 'confirmed' | 'cancelled' | 'pending' | 'completed',
    reason?: string
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update booking status');
}

export async function cancelBooking(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
}

export async function updatePayoutStatus(id: string, payoutStatus: 'paid' | 'pending' | 'processing') {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/bookings/${id}/payout-status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutStatus })
    });
    if (!res.ok) throw new Error('Failed to update payout status');
}
