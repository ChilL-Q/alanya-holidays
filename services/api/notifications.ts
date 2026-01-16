import { supabase } from '../supabase';
import { Notification, NotificationType } from '../../types/index';

export const notificationsService = {
    async createNotification(
        userId: string,
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error' = 'info',
        link?: string
    ) {
        const { error } = await supabase
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type,
                link,
                read: false
            }]);

        if (error) throw error;
    },

    async addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>) {
        return this.createNotification(
            notification.user_id,
            notification.title,
            notification.message,
            notification.type as any,
            notification.link
        );
    },

    async getNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Notification[];
    },

    async markNotificationAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) throw error;
    },
    
    async markAllNotificationsAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId);

        if (error) throw error;
    },

    subscribeToNotifications(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                callback
            )
            .subscribe();
    }
};
