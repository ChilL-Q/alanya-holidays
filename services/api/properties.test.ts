import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertiesService } from './properties';

// Reuse the mock setup logic or consolidate in a helper later
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    }
  }
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('./notifications', () => ({
  notificationsService: {
    createNotification: vi.fn(),
  }
}));

describe('propertiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPropertiesByIds', () => {
    it('returns empty array if no ids provided', async () => {
      const result = await propertiesService.getPropertiesByIds([]);
      expect(result).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('fetches properties correctly', async () => {
        const mockData = [{ id: '1', title: 'Villa' }];
        
        // Mock chain: from('properties').select().in()
        const mockIn = vi.fn().mockResolvedValue({ data: mockData, error: null });
        const mockSelect = vi.fn().mockReturnValue({ in: mockIn });
        mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

        const result = await propertiesService.getPropertiesByIds(['1']);
        expect(mockSupabase.from).toHaveBeenCalledWith('properties');
        expect(result).toEqual(mockData);
    });
  });

  describe('approveProperty', () => {
    it('updates status to approved', async () => {
        // Mock update chain: from().update().eq()
        const mockEq = vi.fn().mockResolvedValue({ error: null });
        const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
        mockSupabase.from.mockReturnValue({ update: mockUpdate, select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({data:{host_id:'1', title:'T', type:'villa'}}) }) }) } as any);

        await propertiesService.approveProperty('prop-1');
        
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    });
  });

  describe('getProperties', () => {
    it('applies filters and pagination correctly', async () => {
        // Mock the sophisticated query chain
        // The chain must be "thenable" (awaitable) AND chainable.
        const mockData = { data: [{ id: '1' }], count: 10 };
        
        const mockChain: any = {
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(), // Returns chain, not promise directly
            
            // Make it awaitable to return data
            then: (resolve: any) => resolve(mockData)
        };

        const mockSelect = vi.fn().mockReturnValue(mockChain);
        mockSupabase.from.mockReturnValue({ select: mockSelect } as any);

        const filters = {
             priceRange: [100, 500] as [number, number],
             types: ['villa'],
             amenities: [],
             minGuests: 4,
             minBedrooms: 2,
             minBeds: 0,
             minBathrooms: 0,
             hasPhotos: false
        };

        await propertiesService.getProperties(
            1, // page
            10, // limit
            filters,
            'Alanya', // location
            undefined, 
            'price_asc' // sort
        );

        // Verify Filter Application
        expect(mockSelect).toHaveBeenCalledWith(expect.anything(), { count: 'exact' });
        expect(mockChain.eq).toHaveBeenCalledWith('status', 'approved');
        
        // Price Range
        expect(mockChain.gte).toHaveBeenCalledWith('price_per_night', 100);
        expect(mockChain.lte).toHaveBeenCalledWith('price_per_night', 500);
        
        // Type
        expect(mockChain.in).toHaveBeenCalledWith('type', ['villa']);
        
        // Capacity
        expect(mockChain.gte).toHaveBeenCalledWith('max_guests', 4);
        expect(mockChain.gte).toHaveBeenCalledWith('bedrooms', 2);
        
        // Location
        expect(mockChain.or).toHaveBeenCalledWith('location.ilike.%Alanya%,title.ilike.%Alanya%');
        
        // Pagination (0 to 9 for page 1 limit 10)
        expect(mockChain.range).toHaveBeenCalledWith(0, 9);
        
        // Sort (Primary)
        expect(mockChain.order).toHaveBeenCalledWith('price_per_night', { ascending: true });
        // Sort (Secondary - ID)
        expect(mockChain.order).toHaveBeenCalledWith('id', { ascending: true });
    });
  });
});
