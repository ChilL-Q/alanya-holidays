import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { chatService } from '../api-services/api/chat';
import { supabase } from '../api-services/supabase';
import { ChatConversation, ChatMessage } from '../types/models';
import { NotificationType } from '../types/enums';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '../lib/queryKeys';

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
    const { addNotification } = useNotifications();
    const queryClient = useQueryClient();
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Fetch conversations from DB
    const { data: conversations = [], isLoading: loading, refetch } = useQuery({
        queryKey: qk.conversations.list(),
        queryFn: async () => {
            try {
                return await chatService.getConversations();
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
                throw error;
            }
        },
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
    });

    const refreshConversations = useCallback(async () => {
        await refetch();
    }, [refetch]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        const subscription = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMessage = payload.new as ChatMessage;

                // Invalidate conversations query to refresh unread counts
                queryClient.invalidateQueries({ queryKey: qk.conversations.list() });

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
    }, [user, activeConversationId, addNotification, queryClient]);

    // Start conversation mutation
    const startConversationMutation = useMutation({
        mutationFn: (data: { propertyId: string; hostId: string }) =>
            chatService.createConversation(data.propertyId, data.hostId),
        onSuccess: (id) => {
            setActiveConversationId(id);
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        },
        onError: (error) => {
            console.error('Failed to create conversation:', error);
        },
    });

    const startConversation = useCallback(async (propertyId: string, hostId: string) => {
        return await startConversationMutation.mutateAsync({ propertyId, hostId });
    }, [startConversationMutation]);

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => {
            if (!activeConversationId) throw new Error('No active conversation');
            return chatService.sendMessage(activeConversationId, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        },
        onError: (error) => {
            console.error('Failed to send message:', error);
        },
    });

    const sendMessage = useCallback(async (content: string) => {
        if (!activeConversationId) return;
        return await sendMessageMutation.mutateAsync(content);
    }, [activeConversationId, sendMessageMutation]);

    // Clear history mutation
    const clearHistoryMutation = useMutation({
        mutationFn: (conversationId: string) => chatService.clearHistory(conversationId),
        onSuccess: (_, conversationId) => {
            if (activeConversationId === conversationId) {
                setMessages([]);
            }
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        },
        onError: (error) => {
            console.error('Failed to clear history:', error);
        },
    });

    const clearHistory = useCallback(async (conversationId: string) => {
        return await clearHistoryMutation.mutateAsync(conversationId);
    }, [clearHistoryMutation]);

    // Submit report mutation
    const submitReportMutation = useMutation({
        mutationFn: (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) =>
            chatService.submitReport(data),
    });

    const submitReport = useCallback(async (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) => {
        try {
            return await submitReportMutation.mutateAsync(data);
        } catch (error) {
            console.error('Failed to submit report:', error);
            throw error;
        }
    }, [submitReportMutation]);

    // Mark as read when opening a conversation
    useEffect(() => {
        let isMounted = true;
        if (activeConversationId) {
            chatService.markAsRead(activeConversationId).then(() => {
                if (isMounted) {
                    queryClient.setQueryData<ChatConversation[]>(
                        qk.conversations.list(),
                        (prev = []) => prev.map(c =>
                            c.id === activeConversationId ? { ...c, unread_count: 0 } : c
                        )
                    );
                }
            });
        }
        return () => { isMounted = false; };
    }, [activeConversationId, queryClient]);

    const totalUnreadCount = useMemo(() => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0), [conversations]);

    // AI Assistant State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatContext, setChatContext] = useState<{ propertyName?: string; location?: string } | null>(null);

    useEffect(() => {
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
