import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatProvider, useChat } from './ChatContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { chatService } from '../api-services/api/chat';


// Mock Dependencies
vi.mock('./AuthContext', () => ({
    useAuth: vi.fn()
}));

vi.mock('./NotificationContext', () => ({
    useNotifications: vi.fn()
}));

vi.mock('../api-services/api/chat', () => ({
    chatService: {
        getConversations: vi.fn(),
        createConversation: vi.fn(),
        sendMessage: vi.fn(),
        clearHistory: vi.fn(),
        submitReport: vi.fn(),
        markAsRead: vi.fn()
    }
}));

// Mock Supabase
const mockUnsubscribe = vi.fn();
const mockChannelOn = vi.fn().mockReturnThis();
const mockChannelSubscribe = vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe });

vi.mock('../api-services/supabase', () => ({
    supabase: {
        channel: vi.fn(() => ({
            on: mockChannelOn,
            subscribe: mockChannelSubscribe
        }))
    }
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
);

describe('ChatContext', () => {
    const mockAddNotification = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNotifications as any).mockReturnValue({ addNotification: mockAddNotification });
        (useAuth as any).mockReturnValue({ user: null });
        (chatService.getConversations as any).mockResolvedValue([]);
        (chatService.markAsRead as any).mockResolvedValue(undefined);
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useChat(), { wrapper });

        expect(result.current.conversations).toEqual([]);
        expect(result.current.activeConversationId).toBeNull();
        expect(result.current.totalUnreadCount).toBe(0);
        expect(result.current.loading).toBe(false);
        expect(result.current.isOpen).toBe(false);
        expect(result.current.messages).toEqual([]);
    });

    it('loads conversations when user is authenticated', async () => {
        const mockConversations = [
            { id: 'c1', unread_count: 2 },
            { id: 'c2', unread_count: 3 }
        ];
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        (chatService.getConversations as any).mockResolvedValue(mockConversations);

        const { result } = renderHook(() => useChat(), { wrapper });

        await waitFor(() => {
            expect(chatService.getConversations).toHaveBeenCalled();
            expect(result.current.conversations).toEqual(mockConversations);
            expect(result.current.totalUnreadCount).toBe(5);
        });
    });

    it('sets active conversation and marks as read, updating local count', async () => {
        const mockConversations = [{ id: 'c1', unread_count: 2 }];
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        (chatService.getConversations as any).mockResolvedValue(mockConversations);
        (chatService.markAsRead as any).mockResolvedValue(undefined);

        const { result } = renderHook(() => useChat(), { wrapper });

        await waitFor(() => {
            expect(result.current.conversations.length).toBe(1);
        });

        await act(async () => {
            result.current.setActiveConversationId('c1');
        });

        expect(result.current.activeConversationId).toBe('c1');
        expect(chatService.markAsRead).toHaveBeenCalledWith('c1');

        await waitFor(() => {
            expect(result.current.conversations[0].unread_count).toBe(0);
        });
    });

    it('sends a message and refreshes conversations', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        (chatService.sendMessage as any).mockResolvedValue({ id: 'm1', content: 'hello' });
        
        const { result } = renderHook(() => useChat(), { wrapper });

        await act(async () => {
            result.current.setActiveConversationId('c1');
        });

        let msg;
        await act(async () => {
            msg = await result.current.sendMessage('hello');
        });

        expect(chatService.sendMessage).toHaveBeenCalledWith('c1', 'hello');
        expect(chatService.getConversations).toHaveBeenCalled();
        expect(msg).toEqual({ id: 'm1', content: 'hello' });
    });

    it('starts a new conversation', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        (chatService.createConversation as any).mockResolvedValue('new-c1');
        
        const { result } = renderHook(() => useChat(), { wrapper });

        let id;
        await act(async () => {
            id = await result.current.startConversation('prop-1', 'host-1');
        });

        expect(chatService.createConversation).toHaveBeenCalledWith('prop-1', 'host-1');
        expect(result.current.activeConversationId).toBe('new-c1');
        expect(id).toBe('new-c1');
    });

    it('clears history', async () => {
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        const { result } = renderHook(() => useChat(), { wrapper });

        await act(async () => {
            await result.current.clearHistory('c1');
        });

        expect(chatService.clearHistory).toHaveBeenCalledWith('c1');
        expect(chatService.getConversations).toHaveBeenCalled();
    });

    it('submits a report', async () => {
        const { result } = renderHook(() => useChat(), { wrapper });
        const reportData = { reporter_id: 'u1', conversation_id: 'c1', reason: 'spam', description: 'test' };

        await act(async () => {
            await result.current.submitReport(reportData);
        });

        expect(chatService.submitReport).toHaveBeenCalledWith(reportData);
    });

    it('handles submit report error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (chatService.submitReport as any).mockRejectedValue(new Error('Report failed'));
        const { result } = renderHook(() => useChat(), { wrapper });
        const reportData = { reporter_id: 'u1', conversation_id: 'c1', reason: 'spam', description: 'test' };

        await expect(act(async () => {
            await result.current.submitReport(reportData);
        })).rejects.toThrow('Report failed');

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('manages AI assistant state', () => {
        const { result } = renderHook(() => useChat(), { wrapper });

        act(() => {
            result.current.setIsOpen(true);
            result.current.addMessage({ role: 'user', content: 'hi' });
            result.current.setIsLoading(true);
        });

        expect(result.current.isOpen).toBe(true);
        expect(result.current.messages).toEqual([{ role: 'user', content: 'hi' }]);
        expect(result.current.isLoading).toBe(true);

        act(() => {
            result.current.clearMessages();
        });

        expect(result.current.messages).toEqual([]);
    });

    it('handles real-time message events', async () => {
        const user = { id: 'user-123' };
        (useAuth as any).mockReturnValue({ user });
        
        renderHook(() => useChat(), { wrapper });

        // Simulate real-time event
        const payload = {
            new: {
                id: 'm2',
                sender_id: 'other-user',
                conversation_id: 'other-conv',
                content: 'Incoming message that is long enough to be truncated'
            }
        };

        const onCallback = mockChannelOn.mock.calls[mockChannelOn.mock.calls.length - 1][2];
        
        await act(async () => {
            onCallback(payload);
        });

        expect(chatService.getConversations).toHaveBeenCalled();
        expect(mockAddNotification).toHaveBeenCalledWith(expect.objectContaining({
            title: 'New Message',
            message: 'New message: Incoming message that is long ...'
        }));
    });

    it('does not trigger notification if message is from self', async () => {
        const user = { id: 'user-123' };
        (useAuth as any).mockReturnValue({ user });
        
        renderHook(() => useChat(), { wrapper });

        const payload = {
            new: {
                id: 'm2',
                sender_id: 'user-123',
                conversation_id: 'c1',
                content: 'My own message'
            }
        };

        const onCallback = mockChannelOn.mock.calls[mockChannelOn.mock.calls.length - 1][2];
        
        await act(async () => {
            onCallback(payload);
        });

        expect(mockAddNotification).not.toHaveBeenCalled();
    });

    it('unsubscribes on unmount', () => {
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
        const { unmount } = renderHook(() => useChat(), { wrapper });
        unmount();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('throws error when used outside ChatProvider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(() => renderHook(() => useChat())).toThrow('useChat must be used within a ChatProvider');
        consoleSpy.mockRestore();
    });
});
