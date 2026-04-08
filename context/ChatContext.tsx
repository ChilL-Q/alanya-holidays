import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { chatService } from '../api-services/api/chat';
import { supabase } from '../api-services/supabase';
import { ChatConversation, ChatMessage } from '../types/models';
import { NotificationType } from '../types/enums';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface ChatContextType {
    conversations: ChatConversation[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    totalUnreadCount: number;
    loading: boolean;
    sendMessage: (content: string) => Promise<ChatMessage | undefined>;
    startConversation: (propertyId: string, hostId: string) => Promise<string>;
    refreshConversations: () => Promise<void>;
    clearHistory: (conversationId: string) => Promise<void>;
    submitReport: (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) => Promise<void>;

    // AI Assistant
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: Array<{ role: 'user' | 'model'; content: string }>;
    addMessage: (msg: { role: 'user' | 'model'; content: string }) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    chatContext: { propertyName?: string; location?: string } | null;
    clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifications(); // Use notification context
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const refreshConversations = useCallback(async () => {
        if (!user) return;
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    }, [user]);

    // ... (Initial load matches existing code)
    // Initial load
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        if (user) {
            refreshConversations();
        } else {
            if (isMountedRef.current) setConversations([]);
        }
        return () => { isMountedRef.current = false; };
    }, [user, refreshConversations]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        // Subscribe to NEW messages to update unread counts or chat window
        const subscription = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMessage = payload.new as ChatMessage;

                // Refresh conversations to update unread counts/latest message
                refreshConversations();

                // If message is NOT from current user AND (we are not in this conversation OR we are not in any conversation)
                // Then trigger notification
                const isSender = newMessage.sender_id === user.id;
                const isActive = newMessage.conversation_id === activeConversationId;

                if (!isSender && !isActive) {
                    addNotification({
                        type: NotificationType.INFO,
                        title: 'New Message',
                        message: `New message: ${newMessage.content.substring(0, 30)}${newMessage.content.length > 30 ? '...' : ''}`,
                        link: '/host/messages',
                        user_id: user.id
                    });
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [user, activeConversationId, refreshConversations, addNotification]);

    const startConversation = useCallback(async (propertyId: string, hostId: string) => {
        setLoading(true);
        try {
            const id = await chatService.createConversation(propertyId, hostId);
            try {
                await refreshConversations();
            } catch (e) {
                console.error('Failed to refresh conversations list:', e);
            }
            setActiveConversationId(id);
            return id;
        } finally {
            setLoading(false);
        }
    }, [refreshConversations]);

    const sendMessage = useCallback(async (content: string) => {
        if (!activeConversationId) return;
        try {
            const msg = await chatService.sendMessage(activeConversationId, content);
            await refreshConversations();
            return msg;
        } catch (error) {
            console.error('Failed to send message', error);
            throw error;
        }
    }, [activeConversationId, refreshConversations]);

    const clearHistory = useCallback(async (conversationId: string) => {
        try {
            await chatService.clearHistory(conversationId);
            if (activeConversationId === conversationId) {
                setMessages([]);
            }
            await refreshConversations();
        } catch (error) {
            console.error('Failed to clear history', error);
            throw error;
        }
    }, [activeConversationId, refreshConversations]);

    const submitReport = useCallback(async (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) => {
        try {
            await chatService.submitReport(data);
        } catch (error) {
            console.error('Failed to submit report', error);
            throw error;
        }
    }, []);

    // Mark as read when opening a conversation
    useEffect(() => {
        let isMounted = true;
        if (activeConversationId) {
            chatService.markAsRead(activeConversationId).then(() => {
                // Update local state to remove unread badge immediately
                if (isMounted) setConversations(prev => prev.map(c =>
                    c.id === activeConversationId ? { ...c, unread_count: 0 } : c
                ));
            });
        }
        return () => { isMounted = false; };
    }, [activeConversationId]);

    const totalUnreadCount = useMemo(() => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0), [conversations]);

    // AI Assistant State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatContext, setChatContext] = useState<{ propertyName?: string; location?: string } | null>(null);

    // Update AI context based on location
    useEffect(() => {
        // Simplified Logic: In a real app, this would use router location
        setChatContext({
            location: 'Alanya, Turkey'
        });
    }, []);

    const addMessage = useCallback((msg: { role: 'user' | 'model'; content: string }) => {
        setMessages(prev => [...prev, msg]);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const value = useMemo(() => ({
        conversations,
        activeConversationId,
        setActiveConversationId,
        totalUnreadCount,
        loading,
        sendMessage,
        startConversation,
        refreshConversations,
        clearHistory,
        submitReport,
        isOpen,
        setIsOpen,
        messages,
        addMessage,
        isLoading,
        setIsLoading,
        chatContext,
        clearMessages
    }), [conversations, activeConversationId, totalUnreadCount, loading, sendMessage, startConversation, refreshConversations, clearHistory, submitReport, isOpen, messages, isLoading, chatContext, addMessage, clearMessages]);

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
