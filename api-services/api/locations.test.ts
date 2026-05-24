import { describe, it, expect, vi, beforeEach } from 'vitest';
import { locationsService } from './locations';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null }),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

describe('locationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      then: (resolve: any) => resolve({ data, count: error ? 0 : 1, error }),
    };
    return chain;
  };

  describe('getLocations', () => {
    it('returns array of active locations ordered by display_order', async () => {
      const mockData = [
        { id: '1', name: 'Alanya Center', is_active: true, display_order: 1, parent_region: 'Alanya' },
        { id: '2', name: 'Mahmutlar', is_active: true, display_order: 2, parent_region: 'Alanya' },
      ];
      mockSupabase.from.mockReturnValue(createMockChain(mockData));
      const result = await locationsService.getLocations();
      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    });

    it('returns empty array when no locations found', async () => {
      mockSupabase.from.mockReturnValue(createMockChain([]));
      const result = await locationsService.getLocations();
      expect(result).toEqual([]);
    });

    it('throws Failed to fetch locations on error', async () => {
      mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB connection lost')));
      await expect(locationsService.getLocations()).rejects.toThrow('Failed to fetch locations');
    });
  });

  describe('getLocationsByRegion', () => {
    it('returns filtered locations for Antalya City', async () => {
      const mockData = [{ id: '3', name: 'Konyaalti', is_active: true, display_order: 1, parent_region: 'Antalya City' }];
      mockSupabase.from.mockReturnValue(createMockChain(mockData));
      const result = await locationsService.getLocationsByRegion('Antalya City');
      expect(result).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
    });

    it('returns filtered locations for Alanya', async () => {
      const mockData = [
        { id: '1', name: 'Alanya Center', is_active: true, display_order: 1, parent_region: 'Alanya' },
        { id: '2', name: 'Mahmutlar', is_active: true, display_order: 2, parent_region: 'Alanya' },
      ];
      mockSupabase.from.mockReturnValue(createMockChain(mockData));
      const result = await locationsService.getLocationsByRegion('Alanya');
      expect(result).toEqual(mockData);
    });

    it('returns filtered locations for Other', async () => {
      const mockData = [{ id: '4', name: 'Side', is_active: true, display_order: 1, parent_region: 'Other' }];
      mockSupabase.from.mockReturnValue(createMockChain(mockData));
      const result = await locationsService.getLocationsByRegion('Other');
      expect(result).toEqual(mockData);
    });

    it('throws Failed to fetch locations on error', async () => {
      mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB error')));
      await expect(locationsService.getLocationsByRegion('Alanya')).rejects.toThrow('Failed to fetch locations');
    });

    it('returns empty array when no locations match region', async () => {
      mockSupabase.from.mockReturnValue(createMockChain([]));
      const result = await locationsService.getLocationsByRegion('Antalya City');
      expect(result).toEqual([]);
    });
  });
});
