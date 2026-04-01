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

  describe('getAllUsers', () => {
     it('fetches all users ordered by creation date', async () => {
         const mockData = [{ id: '1' }];
         const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });

         const result = await usersService.getAllUsers();
         expect(result).toEqual(mockData);
     });

     it('throws error when fetch fails', async () => {
         const mockOrder = vi.fn().mockResolvedValue({ data: null, error: 'Fetch error' });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });

         await expect(usersService.getAllUsers()).rejects.toBe('Fetch error');
     });
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

    it('throws error when user not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: 'User not found' });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(usersService.getUserProfile('nonexistent')).rejects.toBe('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await usersService.updateUserProfile('1', { full_name: 'Jane' });
      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Jane' });
    });

    it('throws error when update fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: 'Update failed' });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await expect(usersService.updateUserProfile('1', { full_name: 'Jane' })).rejects.toBe('Update failed');
    });
  });

  describe('getUsersByRole', () => {
    it('fetches users filtered by role', async () => {
      const mockData = [
        { id: '1', role: 'host', full_name: 'Host User' },
        { id: '2', role: 'host', full_name: 'Another Host' }
      ];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('host');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('role', 'host');
      expect(result).toEqual(mockData);
    });

    it('fetches users with role guest', async () => {
      const mockData = [
        { id: '3', role: 'guest', full_name: 'Guest User' }
      ];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('guest');

      expect(mockEq).toHaveBeenCalledWith('role', 'guest');
      expect(result).toEqual(mockData);
    });

    it('fetches users with role admin', async () => {
      const mockData = [
        { id: '4', role: 'admin', full_name: 'Admin User' }
      ];
      const mockOrder = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('admin');

      expect(mockEq).toHaveBeenCalledWith('role', 'admin');
      expect(result).toEqual(mockData);
    });

    it('returns empty array when no users with role found', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('nonexistent');

      expect(result).toEqual([]);
    });

    it('throws error when query fails', async () => {
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: 'Query error' });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(usersService.getUsersByRole('host')).rejects.toBe('Query error');
    });
  });
});
