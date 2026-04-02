import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPropertyOverride } from './config';

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

describe('getPropertyOverride', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('returns uuid when slug is found', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { uuid: 'abc-123' }, error: null }),
        };
        mockSupabase.from.mockReturnValue(mockChain);

        const result = await getPropertyOverride('my-villa');

        expect(mockSupabase.from).toHaveBeenCalledWith('property_overrides');
        expect(mockChain.eq).toHaveBeenCalledWith('slug', 'my-villa');
        expect(result).toBe('abc-123');
    });

    it('returns null when slug is not found', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
        mockSupabase.from.mockReturnValue(mockChain);

        const result = await getPropertyOverride('unknown-slug');

        expect(result).toBeNull();
    });

    it('returns null and logs error on DB error', async () => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        };
        mockSupabase.from.mockReturnValue(mockChain);

        const result = await getPropertyOverride('some-slug');

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });
});
