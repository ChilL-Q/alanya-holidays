import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { HostLayout } from './HostLayout';

export const HostLayoutController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { totalUnreadCount } = useChat();

    return (
        <HostLayout user={user} unreadCount={totalUnreadCount}>
            {children}
        </HostLayout>
    );
};
