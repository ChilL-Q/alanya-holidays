import { supabase } from '../../supabase';
import { PropertyDB, ApprovalStatus } from '../../../types/index';
import { propertySchema } from '../schemas';

// Helper to get auth token
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getPropertiesByIds(ids: string[]) {
    if (!ids.length) return [];
    const res = await fetch('/api/properties/by-ids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json() as Promise<PropertyDB[]>;
}

export async function createProperty(data: Omit<PropertyDB, 'id' | 'created_at' | 'updated_at'>) {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error('Not authenticated');

    const validatedData = propertySchema.parse(data);
    const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
    });
    if (!res.ok) throw new Error('Failed to create property');
    return res.json() as Promise<PropertyDB>;
}

export async function getProperties(
    page = 1,
    limit = 20,
    filters?: unknown,
    location?: string,
    allowedIds?: string[],
    sort = 'newest'
) {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
    });
    if (filters) params.append('filters', JSON.stringify(filters));
    if (location) params.append('location', location);
    if (allowedIds && allowedIds.length > 0) params.append('allowedIds', JSON.stringify(allowedIds));

    const res = await fetch(`/api/properties?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json() as Promise<{ data: PropertyDB[], count: number }>;
}

export async function getAvailableProperties(checkIn: string, checkOut: string) {
    const res = await fetch('/api/properties/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn, checkOut })
    });
    if (!res.ok) throw new Error('Failed to fetch available properties');
    return res.json() as Promise<PropertyDB[]>;
}

export async function getProperty(id: string) {
    const res = await fetch(`/api/properties/${id}`);
    if (!res.ok) throw new Error('Property not found');
    return res.json() as Promise<PropertyDB>;
}

export async function getPropertiesByHost(hostId: string) {
    const res = await fetch(`/api/properties/host/${hostId}`);
    if (!res.ok) throw new Error('Failed to fetch host properties');
    return res.json() as Promise<PropertyDB[]>;
}

export async function getAdminProperties(statusFilter = 'all', page = 1, limit = 50) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ statusFilter, page: page.toString(), limit: limit.toString() });
    
    const res = await fetch(`/api/properties/admin?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch admin properties');
    return res.json() as Promise<{ data: PropertyDB[], count: number }>;
}

export async function updateProperty(id: string, updates: Partial<PropertyDB>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update property');
}

export async function updatePropertyStatus(
    id: string,
    status: ApprovalStatus | 'approved' | 'rejected' | 'pending',
    reason?: string
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update property status');
}

export async function deleteProperty(id: string, reason?: string) {
    const headers = await getAuthHeaders();
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const res = await fetch(`/api/properties/${id}${params}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to delete property');
}
