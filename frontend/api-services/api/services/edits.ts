import { supabase } from '../../supabase';
import { ServiceDB } from '../../../types/index';

// Fields that must never be overwritten via service_edits
export const IMMUTABLE_SERVICE_FIELDS = new Set([
    'id', 'provider_id', 'status', 'created_at', 'updated_at'
]);

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function requestServiceUpdate(serviceId: string, changes: Partial<ServiceDB>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/${serviceId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(changes)
    });
    if (!res.ok) throw new Error('Failed to request service update');
}

export async function getPendingServiceEdits() {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/services/edits/admin/pending', { headers });
    if (!res.ok) throw new Error('Failed to fetch pending service edits');
    return res.json();
}

export async function getServiceEditsByService(serviceId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/service/${serviceId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch service edits by service');
    return res.json();
}

export async function getMyPendingEdits(_userId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/services/edits/my-pending', { headers });
    if (!res.ok) throw new Error('Failed to fetch my pending edits');
    return res.json();
}

export async function getServiceEdit(editId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/${editId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch service edit');
    return res.json();
}

export async function deleteServiceEdit(editId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/${editId}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Failed to delete service edit');
}

export async function approveServiceEdit(editId: string, _userId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/${editId}/approve`, { method: 'POST', headers });
    if (!res.ok) throw new Error('Failed to approve service edit');
}

export async function rejectServiceEdit(editId: string, userId: string, reason?: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/edits/${editId}/reject`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to reject service edit');
}
