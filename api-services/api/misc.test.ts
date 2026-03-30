import { describe, it, expect, vi, beforeEach } from 'vitest';
import { favoritesService, messagesService } from './misc';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      functions: {
        invoke: vi.fn().mockResolvedValue({})
      }
    }
  }
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

describe('misc services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('favoritesService.toggleFavorite', () => {
    it('removes favorite if it exists', async () => {
      // Mock existing finding
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'fav1' }, error: null });
      const _mockSelectChain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: mockSingle };
      
      // Mock delete
      const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });

      mockSupabase.from.mockImplementation((table) => {
          if (mockDelete.mock.calls.length > 0 && table === 'favorites') return { delete: mockDelete }; 
          // A bit tricky to distinguish calls to same table in same flow without complex mock.
          // Let's simplified mock returning object with ALL methods
          return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: mockSingle,
              delete: mockDelete,
              insert: vi.fn()
          };
      });

      const result = await favoritesService.toggleFavorite({ user_id: 'u1', item_id: 'i1' });
      expect(result).toBe(false); // Removed
      expect(mockDelete).toHaveBeenCalled();
    });

    it('adds favorite if it does not exist', async () => {
      // Mock NOT found
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      
       // Mock insert
      const mockInsert = vi.fn().mockResolvedValue({});

      mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: mockSingle,
          delete: vi.fn(),
          insert: mockInsert
      });

      const result = await favoritesService.toggleFavorite({ user_id: 'u1', item_id: 'i1' });
      expect(result).toBe(true); // Added
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('messagesService.sendMessage', () => {
      it('inserts message', async () => {
          const mockInsert = vi.fn().mockResolvedValue({ error: null });
          mockSupabase.from.mockReturnValue({ insert: mockInsert });
          
          await messagesService.sendMessage({ name: 'Test', email: 'test@test.com', message: 'Hello' });
          expect(mockInsert).toHaveBeenCalled();
      });
  });
});
