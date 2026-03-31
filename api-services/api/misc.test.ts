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

  describe('favoritesService.addFavorite', () => {
    it('upserts favorite', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({ upsert: mockUpsert });

      await favoritesService.addFavorite({ user_id: 'u1', item_id: 'i1' });
      expect(mockUpsert).toHaveBeenCalledWith(
        [{ user_id: 'u1', item_id: 'i1' }],
        { onConflict: 'user_id,item_id', ignoreDuplicates: true }
      );
    });

    it('throws on DB error', async () => {
      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
      });
      await expect(favoritesService.addFavorite({ user_id: 'u1', item_id: 'i1' })).rejects.toBeTruthy();
    });
  });

  describe('favoritesService.removeFavorite', () => {
    it('deletes favorite by user_id and item_id', async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 });
      mockSupabase.from.mockReturnValue({ delete: mockDelete });

      await favoritesService.removeFavorite({ user_id: 'u1', item_id: 'i1' });
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'u1');
      expect(mockEq2).toHaveBeenCalledWith('item_id', 'i1');
    });

    it('throws on DB error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
          })
        })
      });
      await expect(favoritesService.removeFavorite({ user_id: 'u1', item_id: 'i1' })).rejects.toBeTruthy();
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
