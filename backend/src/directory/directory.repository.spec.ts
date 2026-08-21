import { DirectoryRepository } from './directory.repository';
import { SupabaseService } from '../supabase/supabase.service';

interface MockSupabaseClient {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  rpc: jest.Mock;
}

describe('DirectoryRepository', () => {
  let repository: DirectoryRepository;
  let mockSupabaseClient: MockSupabaseClient;
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
      rpc: jest.fn(),
    };

    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as unknown as SupabaseService;

    repository = new DirectoryRepository(mockSupabaseService);
  });

  describe('getDirectoryListingById', () => {
    it('should return null immediately for non-UUID id (e.g. biz-003)', async () => {
      const res = await repository.getDirectoryListingById('biz-003');
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return listing when valid UUID is provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: validUuid, name: 'Hotel Alanya' },
        error: null,
      });

      const res = await repository.getDirectoryListingById(validUuid);
      expect(res).toEqual({ id: validUuid, name: 'Hotel Alanya' });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'directory_listings',
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', validUuid);
    });

    it('should return null gracefully on 22P02 database error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '22P02', message: 'invalid input syntax for type uuid' },
      });

      const res = await repository.getDirectoryListingById(validUuid);
      expect(res).toBeNull();
    });

    it('should return null gracefully on PGRST116 database error', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const res = await repository.getDirectoryListingById(validUuid);
      expect(res).toBeNull();
    });

    it('should throw for unexpected database errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: '50000', message: 'Connection terminated' },
      });

      await expect(
        repository.getDirectoryListingById(validUuid),
      ).rejects.toThrow('Connection terminated');
    });
  });

  describe('getDirectoryListingBySlug', () => {
    it('should return listing when slug exists', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: validUuid, slug: 'biz-003', name: 'Alanya Boat Tours' },
        error: null,
      });

      const res = await repository.getDirectoryListingBySlug('biz-003');
      expect(res).toEqual({
        id: validUuid,
        slug: 'biz-003',
        name: 'Alanya Boat Tours',
      });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith(
        'directory_listings',
      );
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', 'biz-003');
    });

    it('should return null gracefully on PGRST116 / 22P02 errors', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const res = await repository.getDirectoryListingBySlug('missing-slug');
      expect(res).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return undefined immediately for non-UUID userId', async () => {
      const res = await repository.getUserRole('non-uuid');
      expect(res).toBeUndefined();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return role when valid UUID userId provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { role: 'admin' },
        error: null,
      });

      const res = await repository.getUserRole(validUserId);
      expect(res).toBe('admin');
    });
  });

  describe('getDirectoryListingOwner', () => {
    it('should return null immediately for non-UUID id', async () => {
      const res = await repository.getDirectoryListingOwner('non-uuid');
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return owner when valid UUID provided', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { owner_user_id: validUserId },
        error: null,
      });

      const res = await repository.getDirectoryListingOwner(validUuid);
      expect(res).toEqual({ owner_user_id: validUserId });
    });
  });

  describe('getListingClaimById', () => {
    it('should return null immediately for non-UUID id', async () => {
      const res = await repository.getListingClaimById('non-uuid');
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('trackListingView & trackListingClick', () => {
    it('should not invoke RPC if listingId is not a valid UUID', async () => {
      await repository.trackListingView('biz-003');
      await repository.trackListingClick('biz-003', 'website');
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should invoke RPC when valid UUID listingId is provided', async () => {
      await repository.trackListingView(validUuid);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'track_listing_view',
        {
          p_listing_id: validUuid,
        },
      );

      await repository.trackListingClick(validUuid, 'whatsapp');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
        'track_listing_click',
        {
          p_listing_id: validUuid,
          p_click_type: 'whatsapp',
        },
      );
    });
  });

  describe('voteForListing & removeListingVote', () => {
    it('should not invoke RPC if listingId or userId is not a valid UUID', async () => {
      const resVote = await repository.voteForListing(
        'biz-003',
        1,
        validUserId,
      );
      expect(resVote).toEqual([]);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();

      const resRemove = await repository.removeListingVote(
        validUuid,
        'invalid-user',
      );
      expect(resRemove).toEqual([]);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should invoke RPC when valid UUIDs are provided', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{ net_votes: 1, user_vote: 1 }],
        error: null,
      });

      const res = await repository.voteForListing(validUuid, 1, validUserId);
      expect(res).toEqual([{ net_votes: 1, user_vote: 1 }]);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('vote_listing', {
        p_listing_id: validUuid,
        p_listing_type: 'directory',
        p_vote: 1,
        p_user_id: validUserId,
      });
    });
  });

  describe('getUserVotesBatch', () => {
    it('should return empty array if userId is not a valid UUID', async () => {
      const res = await repository.getUserVotesBatch(
        [validUuid],
        'invalid-user',
      );
      expect(res).toEqual([]);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should filter non-UUID listingIds and return empty array if no valid UUIDs remain', async () => {
      const res = await repository.getUserVotesBatch(
        ['biz-001', 'biz-002'],
        validUserId,
      );
      expect(res).toEqual([]);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });
  });

  describe('getListingAddons', () => {
    it('should return empty array immediately for non-UUID listingId', async () => {
      const res = await repository.getListingAddons('biz-003');
      expect(res).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return addons for valid UUID listingId', async () => {
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: [{ id: 'addon-1', name: 'Featured Badge' }],
        error: null,
      });

      const res = await repository.getListingAddons(validUuid);
      expect(res).toEqual([{ id: 'addon-1', name: 'Featured Badge' }]);
    });
  });

  describe('updateListingStatus', () => {
    it('should return null immediately for non-UUID id', async () => {
      const res = await repository.updateListingStatus('biz-003', {
        status: 'approved',
      });
      expect(res).toBeNull();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('getMyListingClaims', () => {
    it('should return empty array immediately for non-UUID userId', async () => {
      const res = await repository.getMyListingClaims('invalid-user');
      expect(res).toEqual([]);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should query listing_claims with user_id and return claims', async () => {
      const claims = [
        {
          id: 'claim-1',
          listing_id: validUuid,
          user_id: validUserId,
          status: 'pending',
          business_name: 'Bistro',
        },
      ];
      mockSupabaseClient.order.mockResolvedValueOnce({
        data: claims,
        error: null,
      });

      const res = await repository.getMyListingClaims(validUserId);
      expect(res).toEqual(claims);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listing_claims');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'user_id',
        validUserId,
      );
    });
  });
});
