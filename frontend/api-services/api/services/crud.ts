import { supabase } from '../../supabase';
import { ServiceDB, ApprovalStatus } from '../../../types/index';
import { serviceSchema } from '../schemas';

// Helper to get auth token
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function createService(data: Omit<ServiceDB, 'id' | 'created_at'>) {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) throw new Error('Not authenticated');

    const validatedData = serviceSchema.parse(data);
    const res = await fetch('/api/services', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData)
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json() as Promise<ServiceDB>;
}

export async function getServices(type?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (type) params.append('type', type);

    const res = await fetch(`/api/services?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json() as Promise<{ data: ServiceDB[], count: number }>;
}

export async function getServicesByProvider(providerId: string) {
    const res = await fetch(`/api/services/provider/${providerId}`);
    if (!res.ok) throw new Error('Failed to fetch provider services');
    return res.json() as Promise<ServiceDB[]>;
}

export async function getService(id: string) {
    const res = await fetch(`/api/services/${id}`);
    if (!res.ok) throw new Error('Service not found');
    return res.json() as Promise<ServiceDB>;
}

export async function updateService(id: string, updates: Partial<ServiceDB>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update service');
}

export async function deleteService(id: string, reason?: string) {
    const headers = await getAuthHeaders();
    const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const res = await fetch(`/api/services/${id}${params}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to delete service');
}

export async function updateServiceStatus(
    id: string,
    status: ApprovalStatus | 'approved' | 'rejected' | 'pending',
    reason?: string
) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/${id}/status`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
    });
    if (!res.ok) throw new Error('Failed to update service status');
}

export async function getAdminServices(statusFilter?: string, typesFilter?: string[], page = 1, limit = 50) {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: limit.toString() 
    });
    if (statusFilter) params.append('statusFilter', statusFilter);
    if (typesFilter && typesFilter.length > 0) params.append('typesFilter', JSON.stringify(typesFilter));

    const res = await fetch(`/api/services/admin?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch admin services');
    return res.json() as Promise<{ data: ServiceDB[], count: number }>;
}
