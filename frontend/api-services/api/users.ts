import { supabase } from '../supabase';
import { UserProfile } from '../../types/index';

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Helper to get auth token
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const usersService = {
    async getAllUsers(page: number = 1, limit: number = 20) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/users?page=${page}&limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json() as Promise<{ data: UserProfile[], pagination: PaginationInfo }>;
    },

    async getUserProfile(id: string) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/users/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json() as Promise<UserProfile>;
    },

    async updateUserProfile(id: string, updates: Partial<UserProfile>) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update profile');
        return res.json();
    },

    async getUsersByRole(role: string, page: number = 1, limit: number = 20) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/users/role/${role}?page=${page}&limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch users by role');
        return res.json() as Promise<{ data: UserProfile[], pagination: PaginationInfo }>;
    }
};
