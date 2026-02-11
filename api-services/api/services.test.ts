import { describe, it, expect, vi, beforeEach } from 'vitest';
import { servicesService } from './services';
import { notificationsService } from './notifications';

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

// Mock notifications to verify integration
vi.mock('./notifications', () => ({
    notificationsService: {
        createNotification: vi.fn()
    }
}));

describe('servicesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServices', () => {
    it('fetches approved services with pagination', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      
      mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: mockRange
      });

      await servicesService.getServices('tour', 1, 10);
      
      // Verify pagination calculation
      // page 1, limit 10 -> range(0, 9)
      expect(mockRange).toHaveBeenCalledWith(0, 9);
    });
  });

  describe('updateService', () => {
    it('updates service and notifies provider', async () => {
        // Mock update
        const mockUpdate = vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null })
        });
        
        // Mock fetch for notification
        const mockService = {
            title: 'Rent a Car',
            description: 'Luxury car for rent',
            price: 100,
            type: 'car',
            provider_id: '550e8400-e29b-41d4-a716-446655440001',
            features: { seats: 5 }
        };
        const mockSingle = vi.fn().mockResolvedValue({ 
            data: mockService
        });

        mockSupabase.from.mockReturnValue({
            update: mockUpdate,
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), // shared by update chain and fetch chain
            single: mockSingle
        });

        await servicesService.updateService('s1', { title: 'New Title' });

        expect(notificationsService.createNotification).toHaveBeenCalledWith(
            '550e8400-e29b-41d4-a716-446655440001', 
            expect.stringContaining('Service Updated'), 
            expect.any(String), 
            'info'
        );
    });
  });
  
  describe('createService', () => {
      it('inserts new service', async () => {
           const mockSingle = vi.fn().mockResolvedValue({ data: { id: 's1' }, error: null });
           const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
           const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
           
           mockSupabase.from.mockReturnValue({ insert: mockInsert });

           const result = await servicesService.createService({ 
               title: 'New Service', 
               description: 'Providing luxury car rental services in Alanya',
               price: 50,
               type: 'car',
               provider_id: '550e8400-e29b-41d4-a716-446655440001' 
           } as any);
           expect(result).toEqual({ id: 's1' });
      });
  });
});
