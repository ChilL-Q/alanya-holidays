import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db, Notification } from '../api-services';

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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [lastNotification, setLastNotification] = useState<Notification | null>(null);
    const isMountedRef = useRef(true);

    const refreshNotifications = useCallback(async () => {
        if (!user) {
            if (isMountedRef.current) setNotifications([]);
            return;
        }
        try {
            const data = await db.getNotifications(user.id);
            if (isMountedRef.current) setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        isMountedRef.current = true;
        refreshNotifications();

        // Real-time subscription
        if (user) {
            const subscription = db.subscribeToNotifications(user.id, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => {
                        // Prevent duplicates
                        if (prev.some(n => n.id === newNotification.id)) return prev;
                        return [newNotification, ...prev];
                    });
                    setLastNotification(newNotification);
                    // Optional: Play a sound or show a toast
                }
            });

            return () => {
                isMountedRef.current = false;
                subscription.unsubscribe();
            };
        }
        return () => { isMountedRef.current = false; };
    }, [user, refreshNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await db.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        if (!user) return;
        try {
            const newNotification: Notification = {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
                user_id: user.id, // For demo, assuming self-notification or logic handles user_id
                read: false,
                created_at: new Date().toISOString()
            };

            setNotifications(prev => [newNotification, ...prev]);
            setLastNotification(newNotification);

            // Play notification sound
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(e => console.error('Error playing sound:', e));

            await db.addNotification(newNotification);
        } catch (error) {
            console.error('Failed to add notification:', error);
        }
    }, [user]);

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
