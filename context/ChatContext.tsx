import React, { createContext, useContext, useEffect, useState } from 'react';
import { chatService } from '../api-services/api/chat';
import { supabase } from '../api-services/supabase';
import { ChatConversation, ChatMessage } from '../types/models';
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
    submitReport: (data: any) => Promise<void>;

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

    // ... (Initial load matches existing code)
    // Initial load
    useEffect(() => {
        if (user) {
            refreshConversations();
        } else {
            setConversations([]);
        }
    }, [user]);

    // Realtime subscription
    useEffect(() => {
        if (!user) return;

        // Subscribe to NEW messages to update unread counts or chat window
        const subscription = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                const newMessage = payload.new as ChatMessage;
                console.log('Chat debug: received message', newMessage);

                // Refresh conversations to update unread counts/latest message
                refreshConversations();

                // If message is NOT from current user AND (we are not in this conversation OR we are not in any conversation)
                // Then trigger notification
                const isSender = newMessage.sender_id === user.id;
                const isActive = newMessage.conversation_id === activeConversationId;
                console.log(`Chat debug: IsSender=${isSender}, IsActive=${isActive}`);

                if (!isSender && !isActive) {
                    console.log('Chat debug: Triggering notification');
                    addNotification({
                        type: 'booking_request' as any,
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
    }, [user, activeConversationId]); // Added activeConversationId dependency to correct check

    const refreshConversations = async () => {
        if (!user) return;
        try {
            const data = await chatService.getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const startConversation = async (propertyId: string, hostId: string) => {
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
    };


    const sendMessage = async (content: string) => {
        if (!activeConversationId) return;
        try {
            const msg = await chatService.sendMessage(activeConversationId, content);
            await refreshConversations(); // Update last message
            return msg;
        } catch (error) {
            console.error('Failed to send message', error);
            throw error;
        }
    };

    const clearHistory = async (conversationId: string) => {
        try {
            await chatService.clearHistory(conversationId);
            if (activeConversationId === conversationId) {
                setMessages([]); // Clear local state for AI/Chat if shared? 
                // Wait, messages for ChatWindow are LOCAL to ChatWindow. 
                // We need to trigger a refresh there. 
                // Currently ChatWindow polls or uses realtime. 
                // Realtime DELETE event? Supabase sends DELETE events. 
                // ChatWindow should handle it.
                // But for good measure we can force a refresh if we exposed a refresh method to it.
                // Actually ChatContext doesn't hold chat messages, ChatWindow does.
            }
            await refreshConversations();
        } catch (error) {
            console.error('Failed to clear history', error);
            throw error;
        }
    };

    const submitReport = async (data: any) => {
        try {
            await chatService.submitReport(data);
        } catch (error) {
            console.error('Failed to submit report', error);
            throw error;
        }
    };

    // Mark as read when opening a conversation
    useEffect(() => {
        if (activeConversationId) {
            chatService.markAsRead(activeConversationId).then(() => {
                // Update local state to remove unread badge immediately
                setConversations(prev => prev.map(c =>
                    c.id === activeConversationId ? { ...c, unread_count: 0 } : c
                ));
            });
        }
    }, [activeConversationId]);

    const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

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

    const addMessage = (msg: { role: 'user' | 'model'; content: string }) => {
        setMessages(prev => [...prev, msg]);
    };

    const clearMessages = () => {
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{
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
            // AI Props
            isOpen,
            setIsOpen,
            messages,
            addMessage,
            isLoading,
            setIsLoading,
            chatContext,
            clearMessages
        }}>
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
