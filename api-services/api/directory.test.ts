import { describe, it, expect, vi, beforeEach } from 'vitest';
import { directoryService } from './directory';

const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn(),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
        }
    }
}));

vi.mock('../supabase', () => ({
    supabase: mockSupabase
}));

const mockListing = {
    id: 'dir-1',
    name: 'Test Clinic',
    category_id: 'medical',
    short_description: 'A clinic',
    location: 'Alanya Center',
    is_featured: false,
    is_verified: true,
    reviews_average: 4.5,
    reviews_count: 10,
    price_level: 2,
    languages_spoken: ['en'],
    certifications: [],
    created_at: '2025-01-01',
    updated_at: '2025-01-01'
};

const makeChain = (overrides: any = {}) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        ...overrides
    };
    return chain;
};

describe('directoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDirectoryListings', () => {
        it('returns listings on success', async () => {
            const chain = makeChain();
            const mockRange = vi.fn().mockResolvedValue({ data: [mockListing], count: 1, error: null });
            chain.order.mockReturnValue({ range: mockRange });
            mockSupabase.from.mockReturnValue(chain);

            const result = await directoryService.getDirectoryListings();
            expect(result.data).toEqual([mockListing]);
            expect(mockSupabase.from).toHaveBeenCalledWith('directory_listings');
        });

        it('throws on error', async () => {
            const chain = makeChain();
            const mockRange = vi.fn().mockResolvedValue({ data: null, count: 0, error: { message: 'DB error' } });
            chain.order.mockReturnValue({ range: mockRange });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.getDirectoryListings()).rejects.toEqual({ message: 'DB error' });
        });
    });

    describe('getDirectoryListing', () => {
        it('returns single listing on success', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            const result = await directoryService.getDirectoryListing('dir-1');
            expect(result).toEqual(mockListing);
            expect(chain.eq).toHaveBeenCalledWith('id', 'dir-1');
        });

        it('returns null when not found (PGRST116)', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
            mockSupabase.from.mockReturnValue(chain);

            const result = await directoryService.getDirectoryListing('missing');
            expect(result).toBeNull();
        });

        it('throws on non-PGRST116 error', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'fail' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.getDirectoryListing('dir-1')).rejects.toEqual({ code: 'OTHER', message: 'fail' });
        });
    });

    describe('getDirectoryListingsByCategory', () => {
        it('returns listings filtered by category', async () => {
            const chain = makeChain();
            // Second order call resolves with data
            chain.order
                .mockReturnValueOnce(chain)
                .mockResolvedValueOnce({ data: [mockListing], error: null });
            mockSupabase.from.mockReturnValue(chain);

            await directoryService.getDirectoryListingsByCategory('medical');
            expect(chain.eq).toHaveBeenCalledWith('category_id', 'medical');
        });

        it('throws on error', async () => {
            const chain = makeChain();
            chain.order
                .mockReturnValueOnce(chain)
                .mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.getDirectoryListingsByCategory('medical')).rejects.toEqual({ message: 'fail' });
        });
    });

    describe('createDirectoryListing', () => {
        it('creates listing and returns it', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            const { id: _id, created_at: _created_at, updated_at: _updated_at, ...listingData } = mockListing;
            const result = await directoryService.createDirectoryListing(listingData as any);
            expect(result).toEqual(mockListing);
            // insert receives sanitized data (is_verified forced to false, gallery added, etc.)
            expect(chain.insert).toHaveBeenCalled();
        });

        it('throws on error', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: null, error: { message: 'insert failed' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.createDirectoryListing({} as any)).rejects.toEqual({ message: 'insert failed' });
        });
    });

    describe('updateDirectoryListing', () => {
        it('updates listing and returns it', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            const result = await directoryService.updateDirectoryListing('dir-1', { name: 'Updated' });
            expect(result).toEqual(mockListing);
            expect(chain.eq).toHaveBeenCalledWith('id', 'dir-1');
        });

        it('throws on error', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: null, error: { message: 'update failed' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.updateDirectoryListing('dir-1', {})).rejects.toEqual({ message: 'update failed' });
        });
    });

    describe('deleteDirectoryListing', () => {
        it('deletes listing successfully', async () => {
            const chain = makeChain();
            chain.eq.mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.deleteDirectoryListing('dir-1')).resolves.toBeUndefined();
            expect(chain.eq).toHaveBeenCalledWith('id', 'dir-1');
        });

        it('throws on error', async () => {
            const chain = makeChain();
            chain.eq.mockResolvedValue({ error: { message: 'delete failed' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.deleteDirectoryListing('dir-1')).rejects.toEqual({ message: 'delete failed' });
        });
    });
});
