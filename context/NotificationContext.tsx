import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { notificationsService } from '../api-services/api/notifications';
import type { Notification } from '../types/models';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
    refreshNotifications: () => Promise<void>;
    lastNotification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [lastNotification, setLastNotification] = useState<Notification | null>(null);

    const userId = user?.id;

    const { data: notifications = [], refetch } = useQuery({
        queryKey: qk.notifications.byUser(userId ?? ''),
        queryFn: async () => {
            try {
                return await notificationsService.getNotifications(userId!);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                throw error;
            }
        },
        enabled: !!userId,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
    });

    useEffect(() => {
        if (!userId) return;

        const subscription = notificationsService.subscribeToNotifications(userId, (payload) => {
            if (payload.eventType === 'INSERT') {
                const newNotification = payload.new as Notification;
                queryClient.setQueryData<Notification[]>(
                    qk.notifications.byUser(userId),
                    (prev = []) => {
                        if (prev.some(n => n.id === newNotification.id)) return prev;
                        return [newNotification, ...prev];
                    }
                );
                setLastNotification(newNotification);
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                audio.play().catch(e => console.error('Error playing notification sound:', e));
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [userId, queryClient]);

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationsService.markNotificationAsRead(id),
        onSuccess: (_data, id) => {
            queryClient.setQueryData<Notification[]>(
                qk.notifications.byUser(userId ?? ''),
                (prev = []) => prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        },
        onError: (error) => {
            console.error('Failed to mark notification as read:', error);
        },
    });

    const markAsRead = React.useCallback(async (id: string) => {
        try {
            await markAsReadMutation.mutateAsync(id);
        } catch {
            // error already logged in onError
        }
    }, [markAsReadMutation]);

    const addNotificationMutation = useMutation({
        mutationFn: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) =>
            notificationsService.addNotification({ ...notification, user_id: userId! }),
        onError: (error) => {
            console.error('Failed to add notification:', error);
        },
    });

    const addNotification = React.useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        if (!userId) return;
        try {
            await addNotificationMutation.mutateAsync(notification);
        } catch {
            // error already logged in onError
        }
    }, [userId, addNotificationMutation]);

    const refreshNotifications = React.useCallback(async () => {
        await refetch();
    }, [refetch]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const value = useMemo(() => ({
        notifications, unreadCount, markAsRead, addNotification, refreshNotifications, lastNotification
    }), [notifications, unreadCount, markAsRead, addNotification, refreshNotifications, lastNotification]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
