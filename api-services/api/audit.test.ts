import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuditLog } from './audit';

const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
        }
    };
});

vi.mock('../supabase', () => ({
    supabase: mockSupabase,
}));

describe('createAuditLog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('inserts audit log entry with correct fields', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue({ insert: mockInsert });

        await createAuditLog('BOOKING_CREATED', { bookingId: '123' }, 'user-1');

        expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
        expect(mockInsert).toHaveBeenCalledWith([
            expect.objectContaining({
                event_type: 'BOOKING_CREATED',
                details: { bookingId: '123' },
                user_id: 'user-1',
            })
        ]);
    });

    it('sets user_id to null when userId is omitted', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: null });
        mockSupabase.from.mockReturnValue({ insert: mockInsert });

        await createAuditLog('REFUND', { amount: 100 });

        expect(mockInsert).toHaveBeenCalledWith([
            expect.objectContaining({ user_id: null })
        ]);
    });

    it('logs error and does not throw when DB insert fails', async () => {
        const mockInsert = vi.fn().mockResolvedValue({ error: { message: 'DB error' } });
        mockSupabase.from.mockReturnValue({ insert: mockInsert });

        await expect(createAuditLog('CANCELLATION', {})).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });

    it('logs error and does not throw on unexpected exception', async () => {
        mockSupabase.from.mockImplementation(() => {
            throw new Error('unexpected');
        });

        await expect(createAuditLog('PROPERTY_APPROVED', {})).resolves.toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
