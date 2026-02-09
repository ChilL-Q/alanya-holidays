import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationsService } from './notifications';

// Mock supabase client
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
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
    });
});
