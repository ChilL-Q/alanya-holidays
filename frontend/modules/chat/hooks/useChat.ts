import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../api-services/supabase';
import { chatService } from '../api';
import { ChatConversation, ChatMessage } from '../../../types/models';
import { NotificationType } from '../../../types/enums';
import { useAuth } from '../../../context/AuthContext';
import { useNotifications } from '../../../context/NotificationContext';
import { qk } from '../../../lib/queryKeys';
import { useChatStore } from '../store/useChatStore';

export const useChat = () => {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const queryClient = useQueryClient();
    
    // Select state from Zustand store
    const activeConversationId = useChatStore((state) => state.activeConversationId);
    const setActiveConversationId = useChatStore((state) => state.setActiveConversationId);
    const isOpen = useChatStore((state) => state.isOpen);
    const setIsOpen = useChatStore((state) => state.setIsOpen);
    const messages = useChatStore((state) => state.messages);
    const addMessage = useChatStore((state) => state.addMessage);
    const isLoading = useChatStore((state) => state.isLoading);
    const setIsLoading = useChatStore((state) => state.setIsLoading);
    const chatContext = useChatStore((state) => state.chatContext);
    const setChatContext = useChatStore((state) => state.setChatContext);
    const clearMessages = useChatStore((state) => state.clearMessages);

    // Fetch conversations from DB
    const { data: conversations = [], isLoading: loading, refetch } = useQuery({
        queryKey: qk.conversations.list(),
        queryFn: async () => {
            return await chatService.getConversations();
        },
        enabled: !!user,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
    });

    const refreshConversations = useCallback(async () => {
        await refetch();
    }, [refetch]);

    // Realtime subscription (handled inside the hook - if multiple components use this hook, 
    // it will mount multiple subscriptions. We should decouple the subscription or use a flag).
    // For now, since the previous ChatContext had it globally mounted once, we should use a global effect pattern 
    // or rely on a wrapper component to mount this hook once.
    // However, TanStack query can deduplicate requests. For websocket, we can track active subscriptions.
    
    useEffect(() => {
        if (!user) return;

        // Unique channel ID per hook instance to prevent Supabase Realtime channel collisions
        const instanceId = Math.random().toString(36).substring(2, 9);
        const channel = supabase
            .channel(`chat_messages:${user.id}:${instanceId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMessage = payload.new as ChatMessage;

                queryClient.invalidateQueries({ queryKey: qk.conversations.list() });

                // We get the latest activeConversationId from the store (not closure)
                const currentActiveId = useChatStore.getState().activeConversationId;
                
                const isSender = newMessage.sender_id === user.id;
                const isActive = newMessage.conversation_id === currentActiveId;

                if (!isSender && !isActive) {
                    addNotification({
                        type: NotificationType.INFO,
                        title: 'New Message',
                        message: `New message: ${newMessage.content.substring(0, 30)}${newMessage.content.length > 30 ? '...' : ''}`,
                        link: '/host/messages',
                        user_id: user.id
                    });
                }
            });

        const subscription = channel.subscribe();

        return () => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
            if (typeof supabase.removeChannel === 'function') {
                supabase.removeChannel(channel);
            }
        };
    }, [user, addNotification, queryClient]);

    // Mutations
    const startConversationMutation = useMutation({
        mutationFn: (data: { propertyId: string; hostId: string }) =>
            chatService.createConversation(data.propertyId, data.hostId),
        onSuccess: (id) => {
            setActiveConversationId(id);
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        }
    });

    const startConversation = useCallback(async (propertyId: string, hostId: string) => {
        return await startConversationMutation.mutateAsync({ propertyId, hostId });
    }, [startConversationMutation]);

    const sendMessageMutation = useMutation({
        mutationFn: (content: string) => {
            if (!activeConversationId) throw new Error('No active conversation');
            return chatService.sendMessage(activeConversationId, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        }
    });

    const sendMessage = useCallback(async (content: string) => {
        if (!activeConversationId) return;
        return await sendMessageMutation.mutateAsync(content);
    }, [activeConversationId, sendMessageMutation]);

    const clearHistoryMutation = useMutation({
        mutationFn: (conversationId: string) => chatService.clearHistory(conversationId),
        onSuccess: (_, conversationId) => {
            if (activeConversationId === conversationId) {
                // Actually the chat history is handled by query in the ChatWindow, this just clears the store messages if any
            }
            queryClient.invalidateQueries({ queryKey: qk.conversations.list() });
        }
    });

    const clearHistory = useCallback(async (conversationId: string) => {
        return await clearHistoryMutation.mutateAsync(conversationId);
    }, [clearHistoryMutation]);

    const submitReportMutation = useMutation({
        mutationFn: (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) =>
            chatService.submitReport(data),
    });

    const submitReport = useCallback(async (data: { reporter_id: string; reported_id?: string; conversation_id: string; reason: string; description: string }) => {
        return await submitReportMutation.mutateAsync(data);
    }, [submitReportMutation]);

    // Mark as read when active conversation changes
    useEffect(() => {
        if (activeConversationId) {
            chatService.markAsRead(activeConversationId)
                .then(() => {
                    queryClient.setQueryData<ChatConversation[]>(
                        qk.conversations.list(),
                        (prev = []) => prev.map(c =>
                            c.id === activeConversationId ? { ...c, unread_count: 0 } : c
                        )
                    );
                })
                .catch(console.error);
        }
    }, [activeConversationId, queryClient]);

    const totalUnreadCount = useMemo(() => conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0), [conversations]);

    return {
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
        setChatContext,
        clearMessages
    };
};
