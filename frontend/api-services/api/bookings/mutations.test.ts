import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBooking } from './mutations';

vi.mock('../../supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'fake-jwt' } }
            })
        }
    }
}));

const MOCK_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MOCK_ITEM_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MOCK_BOOKING_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

describe('createBooking mutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('handles JSON response with id property', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ id: MOCK_BOOKING_ID })
        } as Response);

        const result = await createBooking({
            user_id: MOCK_USER_ID,
            item_id: MOCK_ITEM_ID,
            item_type: 'property',
            check_in: '2026-08-01',
            check_out: '2026-08-05',
            total_price: 100,
            guests: 2
        });

        expect(result).toEqual({ id: MOCK_BOOKING_ID });
    });

    it('handles unquoted raw string response (non-JSON plain text)', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => MOCK_BOOKING_ID
        } as Response);

        const result = await createBooking({
            user_id: MOCK_USER_ID,
            item_id: MOCK_ITEM_ID,
            item_type: 'property',
            check_in: '2026-08-01',
            check_out: '2026-08-05',
            total_price: 100,
            guests: 2
        });

        expect(result).toEqual({ id: MOCK_BOOKING_ID });
    });
});
