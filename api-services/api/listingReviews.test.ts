import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listingReviewsService } from './listingReviews';

const mockUserId = '550e8400-e29b-41d4-a716-446655440001';
const mockAdminId = '550e8400-e29b-41d4-a716-446655440002';

const { mockSupabase, mockGetUserRole } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null }),
      },
    },
    mockGetUserRole: vi.fn(),
  };
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

vi.mock('../auth', () => ({
  getUserRole: mockGetUserRole,
}));

describe('listingReviewsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: mockUserId } }, error: null });
  });

  const createMockChain = (data: any = null, error: any = null, count: number = 0) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      then: (resolve: any) => resolve({ data, count, error }),
    };
    return chain;
  };

  describe('getListingReviews', () => {
    it('returns approved reviews for a listing', async () => {
      const mockData = [
        { id: 'r1', listing_id: 'l1', user_id: mockUserId, rating: 5, comment: 'Great!', status: 'approved', created_at: '2026-01-01' },
      ];
      mockSupabase.from.mockReturnValue(createMockChain(mockData, null, 1));
      const result = await listingReviewsService.getListingReviews('l1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('listing_reviews');
    });

    it('returns empty array when no reviews', async () => {
      mockSupabase.from.mockReturnValue(createMockChain([], null, 0));
      const result = await listingReviewsService.getListingReviews('l1');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('submitListingReview', () => {
    it('submits a review for authenticated user', async () => {
      const mockReview = { id: 'r1', listing_id: 'l1', user_id: mockUserId, rating: 4, comment: 'Good service', status: 'pending' };
      mockSupabase.from.mockReturnValue(createMockChain(mockReview));
      const result = await listingReviewsService.submitListingReview('l1', 4, 'Good service');
      expect(result.rating).toBe(4);
      expect(result.status).toBe('pending');
    });

    it('throws when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(listingReviewsService.submitListingReview('l1', 5, 'Nice')).rejects.toThrow('Not authenticated');
    });
  });

  describe('getUserReviewForListing', () => {
    it('returns user review if exists', async () => {
      const mockReview = { id: 'r1', listing_id: 'l1', user_id: mockUserId, rating: 5, comment: 'Excellent', status: 'pending' };
      mockSupabase.from.mockReturnValue(createMockChain(mockReview));
      const result = await listingReviewsService.getUserReviewForListing('l1');
      expect(result).not.toBeNull();
      expect(result?.rating).toBe(5);
    });

    it('returns null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const result = await listingReviewsService.getUserReviewForListing('l1');
      expect(result).toBeNull();
    });

    it('returns null when no review found', async () => {
      mockSupabase.from.mockReturnValue(createMockChain(null));
      const result = await listingReviewsService.getUserReviewForListing('l1');
      expect(result).toBeNull();
    });
  });

  describe('admin methods', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: mockAdminId } }, error: null });
    });

    describe('getPendingReviews', () => {
      it('returns pending reviews for admin', async () => {
        mockGetUserRole.mockResolvedValue('admin');
        const mockData = [{ id: 'r1', status: 'pending' }];
        mockSupabase.from.mockReturnValue(createMockChain(mockData, null, 1));
        const result = await listingReviewsService.getPendingReviews();
        expect(result.data).toHaveLength(1);
        expect(mockSupabase.from).toHaveBeenCalledWith('listing_reviews');
      });

      it('rejects non-admin users', async () => {
        mockGetUserRole.mockResolvedValue('user');
        await expect(listingReviewsService.getPendingReviews()).rejects.toThrow('Only admins can view pending reviews');
      });
    });

    describe('approveReview', () => {
      it('approves review for admin', async () => {
        mockGetUserRole.mockResolvedValue('admin');
        mockSupabase.from.mockReturnValue(createMockChain(null));
        await expect(listingReviewsService.approveReview('r1')).resolves.toBeUndefined();
      });

      it('rejects non-admin users', async () => {
        mockGetUserRole.mockResolvedValue('host');
        await expect(listingReviewsService.approveReview('r1')).rejects.toThrow('Only admins can approve reviews');
      });
    });

    describe('rejectReview', () => {
      it('rejects review for admin', async () => {
        mockGetUserRole.mockResolvedValue('admin');
        mockSupabase.from.mockReturnValue(createMockChain(null));
        await expect(listingReviewsService.rejectReview('r1')).resolves.toBeUndefined();
      });

      it('rejects non-admin users', async () => {
        mockGetUserRole.mockResolvedValue('guest');
        await expect(listingReviewsService.rejectReview('r1')).rejects.toThrow('Only admins can reject reviews');
      });
    });

    describe('deleteReview', () => {
      it('deletes review for admin', async () => {
        mockGetUserRole.mockResolvedValue('admin');
        mockSupabase.from.mockReturnValue(createMockChain(null));
        await expect(listingReviewsService.deleteReview('r1')).resolves.toBeUndefined();
      });

      it('rejects non-admin users', async () => {
        mockGetUserRole.mockResolvedValue('user');
        await expect(listingReviewsService.deleteReview('r1')).rejects.toThrow('Only admins can delete reviews');
      });
    });
  });
});
