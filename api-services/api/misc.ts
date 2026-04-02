import { supabase } from '../supabase';
import { Message } from '../../types/index';
import { retry } from '../../utils/retry';

export const messagesService = {
    async sendMessage(data: Message) {
        const { error } = await supabase
            .from('messages')
            .insert([data]);

        if (error) throw error;
        
        // Notify Admin
        retry(() => supabase.functions.invoke('send-email', {
            body: {
                type: 'admin_contact_message',
                to: 'contact@alanyaholidays.com', // Notification to Admin
                data: {
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.message
                }
            }
        })).catch(err => console.error('Failed to send admin email:', err));

        return true;
    }
};

export const favoritesService = {
    async addFavorite(data: { user_id: string; item_id: string }) {
        const { error } = await supabase
            .from('favorites')
            .upsert([data], { onConflict: 'user_id,item_id', ignoreDuplicates: true });

        if (error) throw error;
    },

    async removeFavorite(data: { user_id: string; item_id: string }) {
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', data.user_id)
            .eq('item_id', data.item_id);

        if (error) throw error;
    },

    async getFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('item_id')
            .eq('user_id', userId);

        if (error) throw error;
        return data.map((f: any) => f.item_id);
    }
};
