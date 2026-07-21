import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usersService } from './users';

const { mockSupabase, adminSession } = vi.hoisted(() => {
  return {
    adminSession: { data: { session: { user: { id: 'admin-1', user_metadata: { role: 'admin' } } } }, error: null },
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin-1', user_metadata: { role: 'admin' } } } }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1', user_metadata: { role: 'admin' } } }, error: null })
      },
    }
  }
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('../auth', () => ({
  getUserRole: vi.fn().mockResolvedValue('admin')
}));

import { getUserRole } from '../auth';

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getSession.mockResolvedValue(adminSession);
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin-1', user_metadata: { role: 'admin' } } }, error: null });
    (getUserRole as any).mockResolvedValue('admin');
  });

  describe('getAllUsers', () => {
     it('fetches all users ordered by creation date', async () => {
         const mockData = [{ id: '1' }];
         const mockRange = vi.fn().mockResolvedValue({ data: mockData, count: 1, error: null });
         const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });

         const result = await usersService.getAllUsers();
         expect(result.data).toEqual(mockData);
     });

     it('throws error when fetch fails', async () => {
         const mockRange = vi.fn().mockResolvedValue({ data: null, count: 0, error: new Error('Fetch error') });
         const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });

         await expect(usersService.getAllUsers()).rejects.toThrow('Fetch error');
     });

     it('throws when not admin', async () => {
         (getUserRole as any).mockResolvedValueOnce('host');
         const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
         const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
         const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
         mockSupabase.from.mockReturnValue({ select: mockSelect });

         await expect(usersService.getAllUsers()).rejects.toThrow('Not authorized');
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
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('User not found') });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(usersService.getUserProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await usersService.updateUserProfile('admin-1', { full_name: 'Jane' });
      expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Jane' });
    });

    it('throws error when update fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from.mockReturnValue({ update: mockUpdate });

      await expect(usersService.updateUserProfile('1', { full_name: 'Jane' })).rejects.toThrow('Update failed');
    });
  });

  describe('getUsersByRole', () => {
    it('fetches users filtered by role', async () => {
      const mockData = [
        { id: '1', role: 'host', full_name: 'Host User' },
        { id: '2', role: 'host', full_name: 'Another Host' }
      ];
      const mockRange = vi.fn().mockResolvedValue({ data: mockData, count: 2, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('host');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('role', 'host');
      expect(result.data).toEqual(mockData);
    });

    it('fetches users with role guest', async () => {
      const mockData = [
        { id: '3', role: 'guest', full_name: 'Guest User' }
      ];
      const mockRange = vi.fn().mockResolvedValue({ data: mockData, count: 1, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('guest');

      expect(mockEq).toHaveBeenCalledWith('role', 'guest');
      expect(result.data).toEqual(mockData);
    });

    it('fetches users with role admin', async () => {
      const mockData = [
        { id: '4', role: 'admin', full_name: 'Admin User' }
      ];
      const mockRange = vi.fn().mockResolvedValue({ data: mockData, count: 1, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('admin');

      expect(mockEq).toHaveBeenCalledWith('role', 'admin');
      expect(result.data).toEqual(mockData);
    });

    it('returns empty array when no users with role found', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      const result = await usersService.getUsersByRole('nonexistent');

      expect(result.data).toEqual([]);
    });

    it('throws error when query fails', async () => {
      const mockRange = vi.fn().mockResolvedValue({ data: null, count: 0, error: new Error('Query error') });
      const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from.mockReturnValue({ select: mockSelect });

      await expect(usersService.getUsersByRole('host')).rejects.toThrow('Query error');
    });

    it('throws when not admin', async () => {
        (getUserRole as any).mockResolvedValueOnce('host');
        const mockRange = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
        const mockOrder = vi.fn().mockReturnValue({ range: mockRange });
        const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        mockSupabase.from.mockReturnValue({ select: mockSelect });

        await expect(usersService.getUsersByRole('host')).rejects.toThrow('Not authorized');
    });
  });
});
