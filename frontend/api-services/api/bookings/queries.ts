import { supabase } from '../../supabase';
import type { EnrichedBooking } from './index';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getBookings(userId: string): Promise<EnrichedBooking[]> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/bookings/my-bookings', { headers });
    if (!res.ok) throw new Error('Failed to fetch user bookings');
    return res.json() as Promise<EnrichedBooking[]>;
}

export async function getAdminBookings(statusFilter?: string): Promise<EnrichedBooking[]> {
    const headers = await getAuthHeaders();
    const url = statusFilter ? `/api/bookings/admin?status=${statusFilter}` : '/api/bookings/admin';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch admin bookings');
    return res.json() as Promise<EnrichedBooking[]>;
}

export async function getBookingsForHost(hostId: string, dateFrom?: string, dateTo?: string): Promise<EnrichedBooking[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    const url = `/api/bookings/host/${hostId}?${params.toString()}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch host bookings');
    return res.json() as Promise<EnrichedBooking[]>;
}
