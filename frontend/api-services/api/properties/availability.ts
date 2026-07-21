import { supabase } from '../../supabase';
import { PropertyAvailability } from '../../../types/index';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getPropertyAvailability(propertyId: string, startDate: string, endDate: string) {
    const res = await fetch(`/api/properties/${propertyId}/availability?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json() as Promise<PropertyAvailability[]>;
}

export async function updatePropertyAvailability(
    propertyId: string,
    dates: string[],
    status: 'available' | 'booked' | 'blocked',
    price?: number
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${propertyId}/availability`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates, status, price })
    });
    if (!res.ok) throw new Error('Failed to update availability');
}

export async function syncPropertyCalendar(propertyId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${propertyId}/calendar/sync`, {
        method: 'POST',
        headers
    });
    if (!res.ok) throw new Error('Failed to sync calendar');
    return res.json();
}

export async function getUnavailableDates(propertyId: string) {
    const res = await fetch(`/api/properties/${propertyId}/unavailable-dates`);
    if (!res.ok) throw new Error('Failed to fetch unavailable dates');
    return res.json() as Promise<string[]>;
}
