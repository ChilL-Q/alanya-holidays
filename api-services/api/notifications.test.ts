import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsService } from './notifications';

// Mock supabase client
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
            channel: vi.fn()
        }
    }
});

vi.mock('../supabase', () => ({
    supabase: mockSupabase
}));

describe('notificationsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createNotification', () => {
        it('inserts a new notification', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue({ insert: mockInsert });

            await notificationsService.createNotification('user-1', 'Hello', 'World', 'info');

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
            // Check essential fields
            expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    user_id: 'user-1',
                    title: 'Hello'
                })
            ]));
        });

        it('creates notification with default type info', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue({ insert: mockInsert });

            await notificationsService.createNotification('user-1', 'Title', 'Message');

            expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    type: 'info'
                })
            ]));
        });

        it('creates notification with link', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue({ insert: mockInsert });

            await notificationsService.createNotification('user-1', 'Title', 'Message', 'success', '/link');

            expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    link: '/link'
                })
            ]));
        });

        it('throws error when insert fails', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: 'Insert error' });
            mockSupabase.from.mockReturnValue({ insert: mockInsert });

            await expect(notificationsService.createNotification('user-1', 'Title', 'Message')).rejects.toBe('Insert error');
        });
    });

    describe('addNotification', () => {
        it('adds notification using notification object', async () => {
            const mockInsert = vi.fn().mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue({ insert: mockInsert });

            const notification = {
                user_id: 'user-1',
                title: 'Test Title',
                message: 'Test Message',
                type: 'warning' as const,
                link: '/test'
            };

            await notificationsService.addNotification(notification);

            expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    user_id: 'user-1',
                    title: 'Test Title',
                    message: 'Test Message',
                    type: 'warning',
                    link: '/test'
                })
            ]));
        });
    });

    describe('getNotifications', () => {
        it('fetches notifications for a user', async () => {
            const mockData = [{ id: '1', title: 'Test' }];
            const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
            const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ select: mockSelect });

            const result = await notificationsService.getNotifications('user-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
            expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
            expect(result).toEqual(mockData);
        });

        it('throws error when fetch fails', async () => {
             const mockOrder = vi.fn().mockResolvedValue({ data: null, error: 'Error' });
             const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
             const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
             mockSupabase.from.mockReturnValue({ select: mockSelect });

             await expect(notificationsService.getNotifications('user-1')).rejects.toBe('Error');
        });
    });

    describe('markNotificationAsRead', () => {
        it('updates notification status', async () => {
            const mockEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ update: mockUpdate });

            await notificationsService.markNotificationAsRead('notif-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
            expect(mockUpdate).toHaveBeenCalledWith({ read: true });
            expect(mockEq).toHaveBeenCalledWith('id', 'notif-1');
        });

        it('throws error when update fails', async () => {
            const mockEq = vi.fn().mockResolvedValue({ error: 'Update error' });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ update: mockUpdate });

            await expect(notificationsService.markNotificationAsRead('notif-1')).rejects.toBe('Update error');
        });
    });

    describe('markAllNotificationsAsRead', () => {
        it('marks all notifications as read for a user', async () => {
            const mockEq = vi.fn().mockResolvedValue({ error: null });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ update: mockUpdate });

            await notificationsService.markAllNotificationsAsRead('user-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
            expect(mockUpdate).toHaveBeenCalledWith({ read: true });
            expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1');
        });

        it('throws error when bulk update fails', async () => {
            const mockEq = vi.fn().mockResolvedValue({ error: 'Bulk update error' });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
            mockSupabase.from.mockReturnValue({ update: mockUpdate });

            await expect(notificationsService.markAllNotificationsAsRead('user-1')).rejects.toBe('Bulk update error');
        });
    });

    describe('subscribeToNotifications', () => {
        it('creates subscription for user notifications', () => {
            const mockSubscribe = vi.fn().mockReturnValue({ unsubscribe: vi.fn() });
            const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
            const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
            mockSupabase.channel = mockChannel;

            const callback = vi.fn();
            const _result = notificationsService.subscribeToNotifications('user-1', callback);

            expect(mockChannel).toHaveBeenCalledWith('public:notifications');
            expect(mockOn).toHaveBeenCalledWith(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: 'user_id=eq.user-1'
                },
                callback
            );
            expect(mockSubscribe).toHaveBeenCalled();
        });

        it('returns subscription object', () => {
            const mockSubscription = { unsubscribe: vi.fn() };
            const mockSubscribe = vi.fn().mockReturnValue(mockSubscription);
            const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
            const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
            mockSupabase.channel = mockChannel;

            const result = notificationsService.subscribeToNotifications('user-1', vi.fn());

            expect(result).toEqual(mockSubscription);
        });
    });
});
