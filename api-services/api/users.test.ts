import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from './users';

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

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('fetches single user profile', async () => {
      const mockUser = { id: '1', full_name: 'John' };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockUser, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUserProfile('1');
      expect(result).toEqual(mockUser);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await usersService.updateUserProfile('1', { full_name: 'Jane' });
      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Jane' });
    });
  });

  describe('getAllUsers', () => {
     it('fetches all users ordered by creation date', async () => {
         const mockData = [{ id: '1' }];
         const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });
         
         const result = await usersService.getAllUsers();
         expect(result).toEqual(mockData);
     });
  });
});
