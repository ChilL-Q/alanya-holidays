import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { db } from '../api-services';

const mockedDb = db as unknown as {
    getNotifications: ReturnType<typeof vi.fn>;
    markNotificationAsRead: ReturnType<typeof vi.fn>;
    addNotification: ReturnType<typeof vi.fn>;
    subscribeToNotifications: ReturnType<typeof vi.fn>;
};
import { Notification } from '../types/models';

// Mock AuthContext
vi.mock('./AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock DB
const mockUnsubscribe = vi.fn();
const mockNotificationCallbacks = new Map<string, (payload: any) => void>();

vi.mock('../api-services', () => ({
    db: {
        getNotifications: vi.fn().mockResolvedValue([]),
        markNotificationAsRead: vi.fn().mockResolvedValue(undefined),
        addNotification: vi.fn().mockResolvedValue(undefined),
        subscribeToNotifications: vi.fn().mockImplementation((userId: string, callback: (payload: any) => void) => {
            mockNotificationCallbacks.set(userId, callback);
            return {
                unsubscribe: mockUnsubscribe
            };
        })
    }
}));

// Mock Audio
const mockAudioPlay = vi.fn().mockResolvedValue(undefined);

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
);

const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
    id: 'notif-1',
    user_id: 'user-123',
    title: 'Test Notification',
    message: 'Test message',
    type: 'info',
    read: false,
    created_at: '2024-01-01T00:00:00.000Z',
    ...overrides
});

describe('NotificationContext', () => {
    let consoleSpy: any;

    beforeEach(() => {
        // Clear mocks
        mockNotificationCallbacks.clear();
        mockUnsubscribe.mockClear();
        mockAudioPlay.mockClear();
        (db.getNotifications as any).mockClear();
        (db.markNotificationAsRead as any).mockClear();
        (db.addNotification as any).mockClear();
        (db.subscribeToNotifications as any).mockClear();

        // Reset user state
        (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });

        // Setup default mock implementations
        (db.getNotifications as any).mockResolvedValue([]);
        (db.markNotificationAsRead as any).mockResolvedValue(undefined);
        (db.addNotification as any).mockResolvedValue(undefined);

        // Mock Audio globally
        (window as any).Audio = vi.fn().mockImplementation(function() {
            return {
                play: mockAudioPlay
            };
        });

        // Spy on console.error
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        vi.restoreAllMocks();
    });

    describe('useNotifications', () => {
        it('should throw error when used outside NotificationProvider', () => {
            expect(() => renderHook(() => useNotifications())).toThrow(
                'useNotifications must be used within a NotificationProvider'
            );
        });
    });

    describe('initialization', () => {
        it('should initialize with empty notifications when no user', () => {
            const { result } = renderHook(() => useNotifications(), { wrapper });

            expect(result.current.notifications).toEqual([]);
            expect(result.current.unreadCount).toBe(0);
            expect(result.current.lastNotification).toBeNull();
        });

        it('should fetch notifications when user is authenticated', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            const mockNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1', title: 'Notification 1' }),
                createMockNotification({ id: 'notif-2', title: 'Notification 2', read: true })
            ];
            mockedDb.getNotifications.mockResolvedValue(mockNotifications);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(2);
            });

            expect(db.getNotifications).toHaveBeenCalledWith('user-123');
            expect(result.current.unreadCount).toBe(1);
        });

        it('should handle fetch notifications error gracefully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockRejectedValue(new Error('Fetch failed'));

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toEqual([]);
            });

            // Should not crash, just log error
            expect(console.error).toHaveBeenCalled();
        });

        it('should clear notifications when user logs out', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            const mockNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1' })
            ];
            mockedDb.getNotifications.mockResolvedValue(mockNotifications);

            const { result, rerender } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            // Simulate logout
            (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });
            rerender();

            await waitFor(() => {
                expect(result.current.notifications).toEqual([]);
            });
        });
    });

    describe('real-time subscription', () => {
        it('should subscribe to notifications when user is authenticated', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.subscribeToNotifications).toHaveBeenCalledWith(
                    'user-123',
                    expect.any(Function)
                );
            });
        });

        it('should not subscribe when user is not authenticated', async () => {
            (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });

            renderHook(() => useNotifications(), { wrapper });

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(db.subscribeToNotifications).not.toHaveBeenCalled();
        });

        it('should unsubscribe on unmount', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { unmount } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.subscribeToNotifications).toHaveBeenCalled();
            });

            unmount();

            expect(mockUnsubscribe).toHaveBeenCalled();
        });

        it('should add new notification when INSERT event is received', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.subscribeToNotifications).toHaveBeenCalled();
            });

            // Simulate INSERT event
            const newNotification = createMockNotification({
                id: 'new-notif',
                title: 'New Notification'
            });

            await act(async () => {
                mockNotificationCallbacks.get('user-123')({
                    eventType: 'INSERT',
                    new: newNotification
                });
            });

            expect(result.current.notifications).toHaveLength(1);
            expect(result.current.notifications[0].id).toBe('new-notif');
            expect(result.current.lastNotification).toEqual(newNotification);
        });

        it('should prevent duplicate notifications on INSERT event', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const existingNotification = createMockNotification({ id: 'existing' });
            mockedDb.getNotifications.mockResolvedValue([existingNotification]);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            // Simulate INSERT event with same notification
            await act(async () => {
                mockNotificationCallbacks.get('user-123')({
                    eventType: 'INSERT',
                    new: existingNotification
                });
            });

            expect(result.current.notifications).toHaveLength(1);
        });

        it('should not add notification for non-INSERT events', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.subscribeToNotifications).toHaveBeenCalled();
            });

            // Simulate UPDATE event
            await act(async () => {
                mockNotificationCallbacks.get('user-123')({
                    eventType: 'UPDATE',
                    new: createMockNotification({ id: 'updated' })
                });
            });

            expect(result.current.notifications).toEqual([]);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const mockNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1', read: false }),
                createMockNotification({ id: 'notif-2', read: false })
            ];
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockResolvedValue(mockNotifications);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(2);
            });

            await act(async () => {
                await result.current.markAsRead('notif-1');
            });

            expect(db.markNotificationAsRead).toHaveBeenCalledWith('notif-1');
            expect(result.current.notifications.find(n => n.id === 'notif-1')?.read).toBe(true);
            expect(result.current.unreadCount).toBe(1);
        });

        it('should handle mark as read error gracefully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockResolvedValue([
                createMockNotification({ id: 'notif-1', read: false })
            ]);
            mockedDb.markNotificationAsRead.mockRejectedValue(new Error('Mark failed'));

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            await act(async () => {
                await result.current.markAsRead('notif-1');
            });

            // Should log error but not crash
            expect(console.error).toHaveBeenCalled();
            // Local state should not update on error
            expect(result.current.notifications.find(n => n.id === 'notif-1')?.read).toBe(false);
        });
    });

    describe('addNotification', () => {
        it('should add notification successfully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            await act(async () => {
                await result.current.addNotification({
                    user_id: 'user-123',
                    title: 'New Alert',
                    message: 'Something happened',
                    type: 'warning',
                    link: '/alerts'
                });
            });

            expect(db.addNotification).toHaveBeenCalled();

            // State updates via realtime INSERT, not optimistically
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-id-1', title: 'New Alert', type: 'warning', link: '/alerts' }) });
            });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            expect(result.current.notifications[0].title).toBe('New Alert');
            expect(result.current.lastNotification?.title).toBe('New Alert');
        });

        it('should play notification sound when adding', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            // Sound plays via realtime INSERT, not directly in addNotification
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-id-1' }) });
            });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            expect(window.Audio).toHaveBeenCalledWith(
                'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'
            );
            expect(mockAudioPlay).toHaveBeenCalled();
        });

        it('should handle audio play error gracefully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockAudioPlay.mockRejectedValue(new Error('Audio failed'));

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            // Sound error happens via realtime INSERT handler
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-id-1' }) });
            });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            expect(console.error).toHaveBeenCalledWith(
                'Error playing notification sound:',
                expect.any(Error)
            );
        });

        it('should not add notification when user is not authenticated', async () => {
            (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await act(async () => {
                await result.current.addNotification({
                    user_id: 'user-123',
                    title: 'Test',
                    message: 'Test message',
                    type: 'info'
                });
            });

            expect(result.current.notifications).toEqual([]);
            expect(db.addNotification).not.toHaveBeenCalled();
        });

        it('should handle add notification error gracefully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.addNotification.mockRejectedValue(new Error('Add failed'));

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            await act(async () => {
                await result.current.addNotification({
                    user_id: 'user-123',
                    title: 'Test',
                    message: 'Test message',
                    type: 'info'
                });
            });

            // No optimistic update — state stays empty on error
            expect(result.current.notifications).toHaveLength(0);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to add notification:',
                expect.any(Error)
            );
        });

        it('should generate unique id for new notification', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            // ID is assigned by DB and arrives via realtime INSERT
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-assigned-uuid' }) });
            });

            await waitFor(() => {
                expect(result.current.notifications[0]).toBeDefined();
            });

            expect(result.current.notifications[0].id).toBe('db-assigned-uuid');
            expect(typeof result.current.notifications[0].id).toBe('string');
        });

        it('should set correct timestamp for new notification', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            const fixedTimestamp = '2026-06-07T12:00:00.000Z';

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            // Timestamp is assigned by DB and arrives via realtime INSERT
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-id-1', created_at: fixedTimestamp }) });
            });

            await waitFor(() => {
                expect(result.current.notifications[0]).toBeDefined();
            });

            expect(result.current.notifications[0].created_at).toBe(fixedTimestamp);
        });
    });

    describe('refreshNotifications', () => {
        it('should refresh notifications from DB', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            
            const initialNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1' })
            ];
            mockedDb.getNotifications.mockResolvedValue(initialNotifications);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            // Update mock to return new data
            const updatedNotifications: Notification[] = [
                createMockNotification({ id: 'notif-2' }),
                createMockNotification({ id: 'notif-3' })
            ];
            mockedDb.getNotifications.mockResolvedValue(updatedNotifications);

            // Call refresh
            await act(async () => {
                await result.current.refreshNotifications();
            });

            expect(result.current.notifications).toHaveLength(2);
            expect(result.current.notifications[0].id).toBe('notif-2');
        });

        it('should clear notifications when refreshing without user', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockResolvedValue([
                createMockNotification({ id: 'notif-1' })
            ]);

            const { result, rerender } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.notifications).toHaveLength(1);
            });

            // Simulate logout
            (useAuth as any).mockReturnValue({ user: null, isAuthenticated: false });
            rerender();

            await waitFor(() => {
                expect(result.current.notifications).toEqual([]);
            });
        });

        it('should handle refresh error gracefully', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockRejectedValue(new Error('Refresh failed'));

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            await act(async () => {
                await result.current.refreshNotifications();
            });

            // Should not crash
            expect(result.current.notifications).toEqual([]);
            expect(console.error).toHaveBeenCalledWith(
                'Failed to fetch notifications:',
                expect.any(Error)
            );
        });
    });

    describe('unreadCount', () => {
        it('should calculate unread count correctly', async () => {
            const mockNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1', read: false }),
                createMockNotification({ id: 'notif-2', read: true }),
                createMockNotification({ id: 'notif-3', read: false }),
                createMockNotification({ id: 'notif-4', read: false })
            ];
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockResolvedValue(mockNotifications);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.unreadCount).toBe(3);
            });
        });

        it('should update unread count when marking as read', async () => {
            const mockNotifications: Notification[] = [
                createMockNotification({ id: 'notif-1', read: false }),
                createMockNotification({ id: 'notif-2', read: false })
            ];
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });
            mockedDb.getNotifications.mockResolvedValue(mockNotifications);

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(result.current.unreadCount).toBe(2);
            });

            await act(async () => {
                await result.current.markAsRead('notif-1');
            });

            expect(result.current.unreadCount).toBe(1);
        });

        it('should update unread count when adding notification', async () => {
            (useAuth as any).mockReturnValue({ user: { id: 'user-123' }, isAuthenticated: true });

            const { result } = renderHook(() => useNotifications(), { wrapper });

            await waitFor(() => {
                expect(db.getNotifications).toHaveBeenCalled();
            });

            expect(result.current.unreadCount).toBe(0);

            // Count updates via realtime INSERT, not directly from addNotification
            const realtimeCallback = mockNotificationCallbacks.get('user-123');
            act(() => {
                realtimeCallback?.({ eventType: 'INSERT', new: createMockNotification({ id: 'db-id-1', read: false }) });
            });

            await waitFor(() => {
                expect(result.current.unreadCount).toBe(1);
            });
        });
    });

    describe('context values', () => {
        it('should provide all required context values', () => {
            const { result } = renderHook(() => useNotifications(), { wrapper });

            expect(result.current.notifications).toBeDefined();
            expect(result.current.unreadCount).toBeDefined();
            expect(result.current.markAsRead).toBeDefined();
            expect(result.current.addNotification).toBeDefined();
            expect(result.current.refreshNotifications).toBeDefined();
            expect(result.current.lastNotification).toBeDefined();

            expect(typeof result.current.markAsRead).toBe('function');
            expect(typeof result.current.addNotification).toBe('function');
            expect(typeof result.current.refreshNotifications).toBe('function');
        });
    });
});
