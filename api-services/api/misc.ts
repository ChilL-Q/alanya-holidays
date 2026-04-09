import { supabase } from '../supabase';
import { Message } from '../../types/index';
import { retry } from '../../utils/retry';

// eslint-disable-next-line no-control-regex
const STRIP_CONTROL = /[\r\n\x00-\x1f\x7f]/g;

const sanitizeHeaderField = (value: string): string =>
    value.replace(STRIP_CONTROL, '').trim();

const sanitizeMessage = (data: Message): Message => ({
    ...data,
    name: sanitizeHeaderField(data.name).slice(0, 200),
    email: sanitizeHeaderField(data.email).slice(0, 320),
    subject: data.subject ? sanitizeHeaderField(data.subject).slice(0, 500) : data.subject,
    message: sanitizeHeaderField(data.message).slice(0, 10000),
});

export const messagesService = {
    async sendMessage(data: Message) {
        const sanitized = sanitizeMessage(data);

        const { error } = await supabase
            .from('messages')
            .insert([sanitized]);

        if (error) throw error;

        // Notify Admin
        retry(() => supabase.functions.invoke('send-email', {
            body: {
                type: 'admin_contact_message',
                to: 'contact@alanyaholidays.com',
                data: {
                    name: sanitized.name,
                    email: sanitized.email,
                    subject: sanitized.subject,
                    message: sanitized.message
                }
            }
        })).catch(err => console.error('Failed to send admin email:', err));

        return true;
    }
};

export const favoritesService = {
    async addFavorite(data: { item_id: string }) {
        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('favorites')
            .upsert([{ user_id: user.id, item_id: data.item_id }], { onConflict: 'user_id,item_id', ignoreDuplicates: true });

        if (error) throw error;
    },

    async removeFavorite(data: { item_id: string }) {
        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('item_id', data.item_id);

        if (error) throw error;
    },

    async getFavorites() {
        // Authenticate user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('favorites')
            .select('item_id')
            .eq('user_id', user.id);

        if (error) throw error;
        return data.map((f) => f.item_id);
    }
};
