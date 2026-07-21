import { supabase } from '../../supabase';
import { PropertyICalFeed } from '../../../types/index';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getICalFeeds(propertyId: string) {
    const res = await fetch(`/api/properties/${propertyId}/ical`);
    if (!res.ok) throw new Error('Failed to fetch iCal feeds');
    return res.json() as Promise<PropertyICalFeed[]>;
}

export async function addICalFeed(propertyId: string, name: string, url: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${propertyId}/ical`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
    });
    if (!res.ok) throw new Error('Failed to add iCal feed');
    return res.json() as Promise<PropertyICalFeed>;
}

export async function syncPropertyICal(propertyId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${propertyId}/ical/sync`, {
        method: 'POST',
        headers
    });
    if (!res.ok) throw new Error('Failed to sync iCal feeds');
    return res.json();
}

export async function removeICalFeed(id: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/ical/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to remove iCal feed');
}
