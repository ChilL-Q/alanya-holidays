import { supabase } from '../supabase';
import { Message } from '../../types/index';

// Helper to get auth token
async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const messagesService = {
    async sendMessage(data: Message) {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to send message');
        return true;
    }
};

export const favoritesService = {
    async addFavorite(data: { item_id: string }) {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/favorites', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: data.item_id })
        });
        if (!res.ok) throw new Error('Failed to add favorite');
    },

    async removeFavorite(data: { item_id: string }) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/favorites/${data.item_id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to remove favorite');
    },

    async getFavorites() {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return [];
        const res = await fetch('/api/favorites', { headers });
        if (!res.ok) throw new Error('Failed to fetch favorites');
        return res.json() as Promise<string[]>;
    }
};
