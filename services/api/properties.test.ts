import { describe, it, expect, vi, beforeEach } from 'vitest';
import { propertiesService } from './properties';

// Reuse the mock setup logic or consolidate in a helper later
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
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
});
