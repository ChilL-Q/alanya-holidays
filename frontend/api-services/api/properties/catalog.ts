import { PropertyDB } from '../../../types/index';

export async function getPropertyTypes() {
    const res = await fetch('/api/properties/types');
    if (!res.ok) throw new Error('Failed to fetch property types');
    return res.json() as Promise<string[]>;
}

export async function getPropertyLocations(type: string) {
    const res = await fetch(`/api/properties/locations/${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error('Failed to fetch property locations');
    return res.json() as Promise<string[]>;
}

export async function getPropertiesByLocation(type: string, location: string, page = 1, limit = 20) {
    const res = await fetch(`/api/properties/by-location/${encodeURIComponent(type)}/${encodeURIComponent(location)}?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch properties by location');
    return res.json() as Promise<{ data: PropertyDB[]; count: number }>;
}
