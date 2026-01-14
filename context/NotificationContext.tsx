import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db, Notification } from '../services/db';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const refreshNotifications = async () => {
        if (!user) {
            setNotifications([]);
            return;
        }
        try {
            const data = await db.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        refreshNotifications();
        // Poll every minute for new notifications
        const interval = setInterval(refreshNotifications, 60000);
        return () => clearInterval(interval);
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await db.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        if (!user) return;
        try {
            const newNotification: Notification = {
                ...notification,
                id: Math.random().toString(36).substr(2, 9),
                user_id: user.id, // For demo, assuming self-notification or logic handles user_id
                read: false,
                created_at: new Date().toISOString()
            };
            await db.addNotification(newNotification);
            await refreshNotifications();
        } catch (error) {
            console.error('Failed to add notification:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, addNotification, refreshNotifications }}>
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
