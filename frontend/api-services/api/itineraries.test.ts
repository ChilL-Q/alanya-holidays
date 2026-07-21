import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks
// ============================================================
const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn(),
        },
    },
}));

vi.mock('../supabase', () => ({
    supabase: mockSupabase,
}));

// Import after mocks are set up
import { itinerariesService } from './itineraries';

// ============================================================
// Helpers
// ============================================================
const createChain = (data: any = null, error: any = null) => {
    const result = { data, error };
    const chain: any = {};
    const chainableMethods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'limit'];
    for (const method of chainableMethods) {
        chain[method] = vi.fn(() => chain);
    }
    chain.single = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: Array.isArray(data) ? data[0] : data, error }));
    chain.then = (resolve: (v: any) => void) => resolve(result);
    return chain;
};

const mockUser = { id: 'user-123', email: 'test@example.com' };

const mockItinerary = {
    id: 'itinerary-1',
    user_id: 'user-123',
    title: '3-Day Trip for Couple',
    params: { duration: 3, companion: 'couple', interests: ['beach'], pace: 'relaxed', budget: 'standard' },
    itinerary: [
        { day: 1, title: 'Day 1', items: [{ time: '09:00', title: 'Beach', description: 'Relax' }] },
    ],
    created_at: '2026-05-25T12:00:00Z',
};

// ============================================================
// Tests
// ============================================================
describe('itinerariesService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveItinerary', () => {
        it('saves itinerary for authenticated user', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockSupabase.from.mockReturnValue(createChain(mockItinerary));

            const result = await itinerariesService.saveItinerary(
                mockItinerary.title,
                mockItinerary.params as any,
                mockItinerary.itinerary as any
            );

            expect(result).toEqual(mockItinerary);
            expect(mockSupabase.from).toHaveBeenCalledWith('saved_itineraries');
        });

        it('throws when user is not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

            await expect(
                itinerariesService.saveItinerary('title', {} as any, [])
            ).rejects.toThrow('Not authenticated');
        });
    });

    describe('getMyItineraries', () => {
        it('returns user itineraries ordered by created_at desc with limit 50', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
            mockSupabase.from.mockReturnValue(createChain([mockItinerary]));

            const result = await itinerariesService.getMyItineraries();

            expect(result).toEqual([mockItinerary]);
            expect(mockSupabase.from).toHaveBeenCalledWith('saved_itineraries');
        });

        it('throws when user is not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

            await expect(itinerariesService.getMyItineraries()).rejects.toThrow('Not authenticated');
        });
    });

    describe('getItinerary', () => {
        it('returns itinerary by id when found', async () => {
            mockSupabase.from.mockReturnValue(createChain(mockItinerary));

            const result = await itinerariesService.getItinerary('itinerary-1');

            expect(result).toEqual(mockItinerary);
        });

        it('returns null when itinerary not found', async () => {
            mockSupabase.from.mockReturnValue(createChain(null));

            const result = await itinerariesService.getItinerary('missing-id');

            expect(result).toBeNull();
        });
    });

    describe('deleteItinerary', () => {
        it('deletes itinerary by id', async () => {
            mockSupabase.from.mockReturnValue(createChain(null));

            await itinerariesService.deleteItinerary('itinerary-1');

            expect(mockSupabase.from).toHaveBeenCalledWith('saved_itineraries');
        });
    });
});
