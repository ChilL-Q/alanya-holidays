import { SupabaseReviewsRepository } from './supabase-reviews.repository';
import { SupabaseService } from '../../../supabase/supabase.service';

describe('SupabaseReviewsRepository', () => {
  let repository: SupabaseReviewsRepository;
  let mockSupabaseClient: any;
  let mockSupabaseService: SupabaseService;

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = '223e4567-e89b-12d3-a456-426614174001';

  beforeEach(() => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as unknown as SupabaseService;

    repository = new SupabaseReviewsRepository(mockSupabaseService);
  });

  describe('findById', () => {
    it('should return null immediately for non-UUID id without calling Supabase', async () => {
      const res = await repository.findById('biz-003');
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return null when database returns null/empty', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const res = await repository.findById(validUuid);
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listing_reviews');
    });

    it('should return null when database returns 22P02 error', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: '22P02', message: 'invalid input syntax for type uuid' },
      });

      const res = await repository.findById(validUuid);
      expect(res).toBeNull();
    });
  });

  describe('getListingReviews', () => {
    it('should return empty result { data: [], count: 0 } immediately for non-UUID listingId', async () => {
      const res = await repository.getListingReviews('biz-003', 0, 19);
      expect(res).toEqual({ data: [], count: 0 });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return data when valid UUID is provided', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: [{ id: 'rev-1', rating: 5, comment: 'Awesome' }],
        count: 1,
        error: null,
      });

      const res = await repository.getListingReviews(validUuid, 0, 19);
      expect(res).toEqual({
        data: [{ id: 'rev-1', rating: 5, comment: 'Awesome' }],
        count: 1,
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listing_reviews');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'listing_id',
        validUuid,
      );
    });

    it('should return empty result gracefully when PostgREST returns 22P02 error', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { code: '22P02', message: 'invalid input syntax for type uuid' },
      });

      const res = await repository.getListingReviews(validUuid, 0, 19);
      expect(res).toEqual({ data: [], count: 0 });
    });

    it('should return empty result gracefully when PostgREST returns PGRST116 error', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { code: 'PGRST116', message: 'The result contains 0 rows' },
      });

      const res = await repository.getListingReviews(validUuid, 0, 19);
      expect(res).toEqual({ data: [], count: 0 });
    });

    it('should throw error for unexpected database errors', async () => {
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: null,
        count: null,
        error: { code: '42P01', message: 'relation does not exist' },
      });

      await expect(
        repository.getListingReviews(validUuid, 0, 19),
      ).rejects.toThrow('relation does not exist');
    });
  });

  describe('getUserReviewForListing', () => {
    it('should return null immediately for non-UUID listingId', async () => {
      const res = await repository.getUserReviewForListing(
        'biz-003',
        validUserId,
      );
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return null immediately for non-UUID userId', async () => {
      const res = await repository.getUserReviewForListing(
        validUuid,
        'user-invalid',
      );
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return review when valid UUIDs provided', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: { id: 'rev-1', rating: 4 },
        error: null,
      });

      const res = await repository.getUserReviewForListing(
        validUuid,
        validUserId,
      );
      expect(res).toEqual({ id: 'rev-1', rating: 4 });
    });
  });

  describe('getUserRole', () => {
    it('should return undefined immediately for non-UUID userId', async () => {
      const res = await repository.getUserRole('invalid-user');
      expect(res).toBeUndefined();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return role when valid UUID userId provided', async () => {
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });

      const res = await repository.getUserRole(validUserId);
      expect(res).toBe('admin');
    });
  });

  describe('insertListingReview', () => {
    it('should return empty object without querying database when listingId or userId is not a valid UUID', async () => {
      const res1 = await repository.insertListingReview(
        'biz-003',
        5,
        'Great',
        validUserId,
      );
      expect(res1).toEqual({});
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();

      const res2 = await repository.insertListingReview(
        validUuid,
        5,
        'Great',
        'invalid-user',
      );
      expect(res2).toEqual({});
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should insert review when valid UUIDs provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'rev-1', rating: 5 },
        error: null,
      });

      const res = await repository.insertListingReview(
        validUuid,
        5,
        'Great',
        validUserId,
      );
      expect(res).toEqual({ id: 'rev-1', rating: 5 });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listing_reviews');
    });

    it('should return empty object gracefully when database throws 22P02 or PGRST116', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '22P02', message: 'invalid input syntax for type uuid' },
      });

      const res = await repository.insertListingReview(
        validUuid,
        5,
        'Great',
        validUserId,
      );
      expect(res).toEqual({});
    });
  });

  describe('updateReviewStatus & deleteReview', () => {
    it('should return early without querying database when id is not a valid UUID', async () => {
      await repository.updateReviewStatus('invalid-id', 'approved');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();

      await repository.deleteReview('invalid-id');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });
});
