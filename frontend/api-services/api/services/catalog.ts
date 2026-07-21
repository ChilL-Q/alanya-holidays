import { supabase } from '../../supabase';
import { ServiceDB, ServiceModel } from '../../../types/index';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export async function getServiceTypes() {
    const res = await fetch('/api/services/types');
    if (!res.ok) throw new Error('Failed to fetch service types');
    return res.json() as Promise<string[]>;
}

export async function getServiceBrands(type: string) {
    const res = await fetch(`/api/services/brands/${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error('Failed to fetch service brands');
    return res.json() as Promise<string[]>;
}

export async function getServiceModels(type: string, brand: string) {
    const res = await fetch(`/api/services/models/${encodeURIComponent(type)}/${encodeURIComponent(brand)}`);
    if (!res.ok) throw new Error('Failed to fetch service models');
    return res.json() as Promise<ServiceModel[]>;
}

export async function getServiceModel(type: string, brand: string, model: string) {
    const res = await fetch(`/api/services/model/${encodeURIComponent(type)}/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`);
    if (!res.ok) return null;
    return res.json() as Promise<ServiceModel>;
}

export async function updateServiceModel(id: string, updates: Partial<ServiceModel>) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/services/models/${id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update service model');
}

export async function getServicesByModel(type: string, brand: string, model: string) {
    const res = await fetch(`/api/services/by-model/${encodeURIComponent(type)}/${encodeURIComponent(brand)}/${encodeURIComponent(model)}`);
    if (!res.ok) throw new Error('Failed to fetch services by model');
    return res.json() as Promise<ServiceDB[]>;
}
