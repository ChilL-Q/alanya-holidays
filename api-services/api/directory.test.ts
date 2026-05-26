import { describe, it, expect, vi, beforeEach } from 'vitest';
import { directoryService } from './directory';

const { mockSupabase } = vi.hoisted(() => ({
    mockSupabase: {
        from: vi.fn(),
        rpc: vi.fn(),
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
    descriptions: {},
    location: 'Alanya Center',
    is_featured: false,
    is_verified: true,
    reviews_average: 4.5,
    reviews_count: 10,
    price_level: 2,
    languages_spoken: ['en'],
    certifications: [],
    video_url: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01'
};

const makeChain = (overrides: any = {}) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
        ...overrides
    };
    return chain;
};

const setupTableDispatch = (listingChain: any, locationChain: any) => {
    mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'listing_locations') return locationChain;
        return listingChain;
    });
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
            expect(chain.select).toHaveBeenCalledWith('*, listing_locations(id, location_id, display_order, locations(id, name))');
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
            // Four order calls: base_score, is_featured, net_votes, name — last one resolves
            chain.order
                .mockReturnValueOnce(chain)
                .mockReturnValueOnce(chain)
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
                .mockReturnValueOnce(chain)
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

        it('syncs location ids after create when provided', async () => {
            const listingChain = makeChain();
            listingChain.single.mockResolvedValue({ data: mockListing, error: null });
            const locationChain = makeChain();
            locationChain.insert.mockResolvedValue({ error: null });
            setupTableDispatch(listingChain, locationChain);

            const { id: _id, created_at: _created_at, updated_at: _updated_at, ...listingData } = mockListing;
            await directoryService.createDirectoryListing(listingData as any, ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']);

            expect(locationChain.insert).toHaveBeenCalledWith([
                { listing_id: 'dir-1', location_id: '00000000-0000-0000-0000-000000000001', display_order: 0 },
                { listing_id: 'dir-1', location_id: '00000000-0000-0000-0000-000000000002', display_order: 1 }
            ]);
        });

        it('throws when location sync fails after create', async () => {
            const listingChain = makeChain();
            listingChain.single.mockResolvedValue({ data: mockListing, error: null });
            const locationChain = makeChain();
            locationChain.insert.mockResolvedValue({ error: { message: 'RLS denied' } });
            setupTableDispatch(listingChain, locationChain);

            const { id: _id, created_at: _created_at, updated_at: _updated_at, ...listingData } = mockListing;
            await expect(directoryService.createDirectoryListing(listingData as any, ['00000000-0000-0000-0000-000000000001']))
                .rejects.toThrow('Listing created but location sync failed: RLS denied');
        });

        it('throws on error', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: null, error: { message: 'insert failed' } });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.createDirectoryListing({} as any)).rejects.toEqual({ message: 'insert failed' });
        });

        it('passes descriptions through sanitize', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            const { id: _id, created_at: _created_at, updated_at: _updated_at, ...listingData } = mockListing;
            await directoryService.createDirectoryListing({
                ...listingData,
                descriptions: { en: 'Hello\x00World', tr: 'Merhaba\n' }
            } as any);

            const insertCall = chain.insert.mock.calls[0][0];
            expect(insertCall.descriptions).toEqual({ en: 'HelloWorld', tr: 'Merhaba' });
        });

        it('rejects invalid UUIDs in locationIds', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            const { id: _id, created_at: _created_at, updated_at: _updated_at, ...listingData } = mockListing;
            await expect(directoryService.createDirectoryListing(listingData as any, ['not-a-uuid']))
                .rejects.toThrow('Invalid UUID: not-a-uuid');
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
            expect(chain.delete).not.toHaveBeenCalled();
        });

        it('syncs location ids when provided', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            chain.upsert.mockResolvedValue({ error: null });
            chain.not.mockResolvedValue({ error: null });
            mockSupabase.from.mockReturnValue(chain);

            await directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002']);
            expect(chain.upsert).toHaveBeenCalledWith(
                [
                    { listing_id: 'dir-1', location_id: '00000000-0000-0000-0000-000000000001', display_order: 0 },
                    { listing_id: 'dir-1', location_id: '00000000-0000-0000-0000-000000000002', display_order: 1 }
                ],
                { onConflict: 'listing_id,location_id' }
            );
            expect(chain.delete).toHaveBeenCalled();
            expect(chain.not).toHaveBeenCalledWith('location_id', 'in', '(00000000-0000-0000-0000-000000000001,00000000-0000-0000-0000-000000000002)');
        });

        it('throws when location upsert fails', async () => {
            const listingChain = makeChain();
            listingChain.single.mockResolvedValue({ data: mockListing, error: null });
            const locationChain = makeChain();
            locationChain.upsert.mockResolvedValue({ error: { message: 'upsert failed' } });
            setupTableDispatch(listingChain, locationChain);

            await expect(directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, ['00000000-0000-0000-0000-000000000001']))
                .rejects.toThrow('Location sync failed: upsert failed');
        });

        it('throws when location cleanup fails', async () => {
            const listingChain = makeChain();
            listingChain.single.mockResolvedValue({ data: mockListing, error: null });
            const locationChain = makeChain();
            locationChain.upsert.mockResolvedValue({ error: null });
            locationChain.not.mockResolvedValue({ error: { message: 'delete failed' } });
            setupTableDispatch(listingChain, locationChain);

            await expect(directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, ['00000000-0000-0000-0000-000000000001']))
                .rejects.toThrow('Location cleanup failed: delete failed');
        });

        it('removes all location ids when empty array provided', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            await directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, []);
            expect(chain.delete).toHaveBeenCalled();
            expect(chain.insert).not.toHaveBeenCalled();
            expect(chain.upsert).not.toHaveBeenCalled();
        });

        it('throws when clearing locations fails', async () => {
            const listingChain = makeChain();
            listingChain.single.mockResolvedValue({ data: mockListing, error: null });
            const locationChain = makeChain();
            locationChain.eq.mockResolvedValue({ error: { message: 'clear failed' } });
            setupTableDispatch(listingChain, locationChain);

            await expect(directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, []))
                .rejects.toThrow('Failed to clear listing locations: clear failed');
        });

        it('rejects invalid UUIDs in locationIds', async () => {
            const chain = makeChain();
            chain.single.mockResolvedValue({ data: mockListing, error: null });
            mockSupabase.from.mockReturnValue(chain);

            await expect(directoryService.updateDirectoryListing('dir-1', { name: 'Updated' }, ['bad-uuid']))
                .rejects.toThrow('Invalid UUID: bad-uuid');
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

    describe('trackListingView', () => {
        it('calls track_listing_view RPC', async () => {
            mockSupabase.rpc = vi.fn().mockResolvedValue({ error: null });

            await directoryService.trackListingView('dir-1');
            expect(mockSupabase.rpc).toHaveBeenCalledWith('track_listing_view', { p_listing_id: 'dir-1' });
        });
    });

    describe('trackListingClick', () => {
        it('calls track_listing_click RPC with correct type', async () => {
            mockSupabase.rpc = vi.fn().mockResolvedValue({ error: null });

            await directoryService.trackListingClick('dir-1', 'whatsapp');
            expect(mockSupabase.rpc).toHaveBeenCalledWith('track_listing_click', {
                p_listing_id: 'dir-1',
                p_click_type: 'whatsapp'
            });
        });
    });

    describe('getDirectoryAnalyticsForOwner', () => {
        it('returns analytics data', async () => {
            const mockAnalytics = [
                {
                    listing_id: 'dir-1',
                    listing_name: 'Test Clinic',
                    listing_category_id: 'medical',
                    total_views: 100,
                    total_whatsapp_clicks: 10,
                    total_website_clicks: 5,
                    total_map_clicks: 3,
                    daily_data: []
                }
            ];
            mockSupabase.rpc = vi.fn().mockResolvedValue({ data: mockAnalytics, error: null });

            const result = await directoryService.getDirectoryAnalyticsForOwner(30);
            expect(result).toEqual(mockAnalytics);
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_directory_analytics_for_owner', {
                p_owner_id: 'u1',
                p_days: 30
            });
        });

        it('throws when not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            await expect(directoryService.getDirectoryAnalyticsForOwner()).rejects.toThrow('Not authenticated');
        });
    });

    describe('getCategoryAnalyticsAverage', () => {
        it('returns category average data', async () => {
            const mockAvg = {
                avg_views: 42.5,
                avg_whatsapp_clicks: 5,
                avg_website_clicks: 3,
                avg_map_clicks: 1,
                listing_count: 3
            };
            mockSupabase.rpc = vi.fn().mockResolvedValue({ data: [mockAvg], error: null });

            const result = await directoryService.getCategoryAnalyticsAverage('medical', 30);
            expect(result).toEqual(mockAvg);
            expect(mockSupabase.rpc).toHaveBeenCalledWith('get_category_analytics_average', {
                p_category_id: 'medical',
                p_days: 30
            });
        });

        it('returns null when data is empty', async () => {
            mockSupabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null });

            const result = await directoryService.getCategoryAnalyticsAverage('medical');
            expect(result).toBeNull();
        });

        it('throws on RPC error', async () => {
            mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

            await expect(directoryService.getCategoryAnalyticsAverage('medical'))
                .rejects.toEqual({ message: 'RPC failed' });
        });
    });
});