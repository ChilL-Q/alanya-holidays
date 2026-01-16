import { supabase } from '../supabase';
import { Message } from '../../types/index';

export const messagesService = {
    async sendMessage(data: Message) {
        const { error } = await supabase
            .from('messages')
            .insert([data]);

        if (error) throw error;
        return true;
    }
};

export const favoritesService = {
    async toggleFavorite(data: { user_id: string; item_id: string }) {
        // Check if exists
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', data.user_id)
            .eq('item_id', data.item_id)
            .single();

        if (existing) {
            await supabase.from('favorites').delete().eq('id', existing.id);
            return false; // Removed
        } else {
            await supabase.from('favorites').insert([data]);
            return true; // Added
        }
    },

    async getFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('item_id') // We only need IDs to filter/check
            .eq('user_id', userId);

        if (error) throw error;
        return data.map((f: any) => f.item_id); // Returns array of IDs
    }
};
