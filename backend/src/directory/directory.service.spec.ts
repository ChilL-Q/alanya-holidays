import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';

describe('DirectoryService', () => {
  let service: DirectoryService;
  let mockUserRolesRepo: { getRole: jest.Mock };
  let mockRepository: {
    getDirectoryListings: jest.Mock;
    searchDirectoryListings: jest.Mock;
    getFreeListings: jest.Mock;
    getPremiumListings: jest.Mock;
    getSignatureListings: jest.Mock;
    getRecentlyClaimedListings: jest.Mock;
    getDirectoryListingBySlug: jest.Mock;
    getDirectoryListingById: jest.Mock;
    updateListingStatus: jest.Mock;
    insertDirectoryListing: jest.Mock;
    updateDirectoryListing: jest.Mock;
    deleteDirectoryListing: jest.Mock;
    trackListingView: jest.Mock;
    trackListingClick: jest.Mock;
    voteForListing: jest.Mock;
    getUserVotesBatch: jest.Mock;
    removeListingVote: jest.Mock;
    invokeFunction: jest.Mock;
    callApproveListingClaimRpc: jest.Mock;
    callRejectListingClaimRpc: jest.Mock;
    getListingClaimById: jest.Mock;
    getListingAddons: jest.Mock;
    getDirectoryListingOwner: jest.Mock;
    insertListingLocations: jest.Mock;
    upsertListingLocations: jest.Mock;
    deleteListingLocations: jest.Mock;
    getMyDirectoryListings: jest.Mock;
    getMyListingClaims: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      getDirectoryListings: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      searchDirectoryListings: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0 }),
      getFreeListings: jest.fn().mockResolvedValue([]),
      getPremiumListings: jest.fn().mockResolvedValue([]),
      getSignatureListings: jest.fn().mockResolvedValue([]),
      getRecentlyClaimedListings: jest.fn().mockResolvedValue([]),
      getDirectoryListingBySlug: jest.fn(),
      getDirectoryListingById: jest.fn(),
      updateListingStatus: jest.fn(),
      insertDirectoryListing: jest.fn(),
      updateDirectoryListing: jest.fn(),
      deleteDirectoryListing: jest.fn(),
      trackListingView: jest.fn().mockResolvedValue({ success: true }),
      trackListingClick: jest.fn().mockResolvedValue({ success: true }),
      voteForListing: jest.fn(),
      getUserVotesBatch: jest.fn().mockResolvedValue([]),
      removeListingVote: jest.fn().mockResolvedValue([]),
      invokeFunction: jest.fn(),
      callApproveListingClaimRpc: jest.fn(),
      callRejectListingClaimRpc: jest.fn(),
      getListingClaimById: jest.fn(),
      getListingAddons: jest.fn().mockResolvedValue([]),
      getDirectoryListingOwner: jest.fn(),
      insertListingLocations: jest.fn().mockResolvedValue(undefined),
      upsertListingLocations: jest.fn().mockResolvedValue(undefined),
      deleteListingLocations: jest.fn().mockResolvedValue(undefined),
      getMyDirectoryListings: jest.fn().mockResolvedValue([]),
      getMyListingClaims: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryService,
        {
          provide: DirectoryRepository,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
        {
          provide: RedisService,
          useValue: {
            getJson: jest.fn().mockResolvedValue(null),
            setJson: jest.fn().mockResolvedValue(undefined),
            delByPattern: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<DirectoryService>(DirectoryService);
  });

  describe('getDirectoryListing', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should query getDirectoryListingById when id is a valid UUID', async () => {
      mockRepository.getDirectoryListingById.mockResolvedValueOnce({
        id: validUuid,
        name: 'Grand Hotel',
      });

      const res = await service.getDirectoryListing(validUuid);
      expect(res).toEqual({ id: validUuid, name: 'Grand Hotel' });
      expect(mockRepository.getDirectoryListingById).toHaveBeenCalledWith(
        validUuid,
      );
      expect(mockRepository.getDirectoryListingBySlug).not.toHaveBeenCalled();
    });

    it('should fallback to getDirectoryListingBySlug when id is not a UUID (e.g. biz-003)', async () => {
      mockRepository.getDirectoryListingBySlug.mockResolvedValueOnce({
        id: validUuid,
        slug: 'biz-003',
        name: 'Alanya Boat Tours',
      });

      const res = await service.getDirectoryListing('biz-003');
      expect(res).toEqual({
        id: validUuid,
        slug: 'biz-003',
        name: 'Alanya Boat Tours',
      });
      expect(mockRepository.getDirectoryListingById).not.toHaveBeenCalled();
      expect(mockRepository.getDirectoryListingBySlug).toHaveBeenCalledWith(
        'biz-003',
      );
    });

    it('should return null when non-UUID slug is not found in database', async () => {
      mockRepository.getDirectoryListingBySlug.mockResolvedValueOnce(null);

      const res = await service.getDirectoryListing('non-existent-slug');
      expect(res).toBeNull();
      expect(mockRepository.getDirectoryListingById).not.toHaveBeenCalled();
      expect(mockRepository.getDirectoryListingBySlug).toHaveBeenCalledWith(
        'non-existent-slug',
      );
    });
  });

  describe('getDirectoryListingBySlug', () => {
    it('should return listing data when found', async () => {
      mockRepository.getDirectoryListingBySlug.mockResolvedValueOnce({
        id: 'dir-1',
        title: 'Cafe Alanya',
      });

      const res = await service.getDirectoryListingBySlug('cafe-alanya');
      expect(res).toEqual({ id: 'dir-1', title: 'Cafe Alanya' });
    });
  });

  describe('approveDirectoryListing', () => {
    it('should throw UnauthorizedException if non-admin attempts approval', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.approveDirectoryListing('dir-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call repository updateListingStatus when user is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.updateListingStatus.mockResolvedValueOnce({
        id: 'dir-1',
        name: 'Cafe Alanya',
        owner_user_id: 'owner-1',
      });

      const res = await service.approveDirectoryListing('dir-1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateListingStatus).toHaveBeenCalledWith('dir-1', {
        status: 'approved',
      });
      expect(mockRepository.invokeFunction).toHaveBeenCalledWith(
        'send-email',
        expect.any(Object),
      );
    });
  });

  describe('voteForListing', () => {
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should call repository voteForListing for valid UUIDs', async () => {
      mockRepository.voteForListing.mockResolvedValueOnce([
        { net_votes: 5, user_vote: 1 },
      ]);

      const res = await service.voteForListing(validListingId, 1, validUserId);
      expect(res).toEqual({ netVotes: 5, userVote: 1 });
      expect(mockRepository.voteForListing).toHaveBeenCalledWith(
        validListingId,
        1,
        validUserId,
      );
    });

    it('should return default 0 votes when repository returns empty array', async () => {
      mockRepository.voteForListing.mockResolvedValueOnce([]);

      const res = await service.voteForListing(validListingId, 1, validUserId);
      expect(res).toEqual({ netVotes: 0, userVote: 0 });
    });

    it('should safely return 0 votes without querying repository when listingId is not a valid UUID (e.g. biz-003)', async () => {
      const res = await service.voteForListing('biz-003', 1, validUserId);
      expect(res).toEqual({ netVotes: 0, userVote: 0 });
      expect(mockRepository.voteForListing).not.toHaveBeenCalled();
    });

    it('should safely return 0 votes without querying repository when userId is not a valid UUID', async () => {
      const res = await service.voteForListing(
        validListingId,
        1,
        'invalid-user',
      );
      expect(res).toEqual({ netVotes: 0, userVote: 0 });
      expect(mockRepository.voteForListing).not.toHaveBeenCalled();
    });
  });

  describe('removeListingVote', () => {
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should call repository removeListingVote and return netVotes for valid UUIDs', async () => {
      mockRepository.removeListingVote.mockResolvedValueOnce([
        { net_votes: 3 },
      ]);

      const res = await service.removeListingVote(validListingId, validUserId);
      expect(res).toEqual({ netVotes: 3 });
      expect(mockRepository.removeListingVote).toHaveBeenCalledWith(
        validListingId,
        validUserId,
      );
    });

    it('should return 0 netVotes when repository returns empty array', async () => {
      mockRepository.removeListingVote.mockResolvedValueOnce([]);

      const res = await service.removeListingVote(validListingId, validUserId);
      expect(res).toEqual({ netVotes: 0 });
    });

    it('should safely return 0 netVotes without querying repository when listingId is not a valid UUID', async () => {
      const res = await service.removeListingVote('biz-003', validUserId);
      expect(res).toEqual({ netVotes: 0 });
      expect(mockRepository.removeListingVote).not.toHaveBeenCalled();
    });
  });

  describe('getListingAddons', () => {
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return empty array without querying repository when listingId is not a valid UUID (e.g. biz-003)', async () => {
      const res = await service.getListingAddons('biz-003');
      expect(res).toEqual([]);
      expect(mockRepository.getListingClaimById).not.toHaveBeenCalled();
    });

    it('should query repository when listingId is a valid UUID', async () => {
      mockRepository.getListingAddons.mockResolvedValueOnce([
        { id: 'addon-1' },
      ]);
      const res = await service.getListingAddons(validListingId);
      expect(res).toEqual([{ id: 'addon-1' }]);
      expect(mockRepository.getListingAddons).toHaveBeenCalledWith(
        validListingId,
      );
    });
  });

  describe('approveListingClaim', () => {
    it('should throw UnauthorizedException if non-admin attempts claim approval', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.approveListingClaim('claim-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should approve claim and dispatch email notification when successful', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.callApproveListingClaimRpc.mockResolvedValueOnce({
        data: [{ success: true, message: 'Claim approved' }],
        error: null,
      });
      mockRepository.getListingClaimById.mockResolvedValueOnce({
        email: 'owner@example.com',
        business_name: 'Alanya Cafe',
      });

      const res = await service.approveListingClaim('claim-1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.callApproveListingClaimRpc).toHaveBeenCalledWith(
        'claim-1',
        'admin-1',
      );
      expect(mockRepository.invokeFunction).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          body: {
            type: 'listing_claim_approved',
            data: {
              claimantEmail: 'owner@example.com',
              businessName: 'Alanya Cafe',
            },
          },
        }),
      );
    });

    it('should throw error when RPC returns failure', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.callApproveListingClaimRpc.mockResolvedValueOnce({
        data: [{ success: false, message: 'Claim not found or invalid' }],
        error: null,
      });

      await expect(
        service.approveListingClaim('claim-1', 'admin-1'),
      ).rejects.toThrow('Claim not found or invalid');
    });
  });

  describe('rejectListingClaim', () => {
    it('should throw UnauthorizedException if non-admin attempts claim rejection', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.rejectListingClaim('claim-1', 'Invalid documents', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject claim and dispatch email notification when successful', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.callRejectListingClaimRpc.mockResolvedValueOnce({
        data: [{ success: true, message: 'Claim rejected' }],
        error: null,
      });
      mockRepository.getListingClaimById.mockResolvedValueOnce({
        email: 'owner@example.com',
        business_name: 'Alanya Cafe',
      });

      const res = await service.rejectListingClaim(
        'claim-1',
        'Invalid documents',
        'admin-1',
      );
      expect(res).toEqual({ success: true });
      expect(mockRepository.callRejectListingClaimRpc).toHaveBeenCalledWith(
        'claim-1',
        'Invalid documents',
        'admin-1',
      );
      expect(mockRepository.invokeFunction).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          body: {
            type: 'listing_claim_rejected',
            data: {
              claimantEmail: 'owner@example.com',
              businessName: 'Alanya Cafe',
              rejectionReason: 'Invalid documents',
            },
          },
        }),
      );
    });

    it('should throw error when RPC returns failure', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.callRejectListingClaimRpc.mockResolvedValueOnce({
        data: [{ success: false, message: 'Claim not found or invalid' }],
        error: null,
      });

      await expect(
        service.rejectListingClaim('claim-1', 'Invalid docs', 'admin-1'),
      ).rejects.toThrow('Claim not found or invalid');
    });
  });

  describe('saveDraft', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';
    const validDraftId = '123e4567-e89b-12d3-a456-426614174000';

    it('should create a new draft with status = draft and default name when draftId is not provided', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: validDraftId,
        name: 'Untitled Draft',
        status: 'draft',
        owner_user_id: validUserId,
        tier: 'explorer',
      });

      const res = await service.saveDraft({}, [], validUserId);

      expect(res).toEqual(
        expect.objectContaining({
          id: validDraftId,
          status: 'draft',
          owner_user_id: validUserId,
        }),
      );
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Untitled Draft',
          status: 'draft',
          owner_user_id: validUserId,
          tier: 'explorer',
          is_featured: false,
          is_verified: false,
          is_premium: false,
          base_score: 0,
        }),
      );
    });

    it('should include phone and email in safeData when saving a draft', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: validDraftId,
        name: 'Draft With Phone & Email',
        status: 'draft',
        owner_user_id: validUserId,
        phone: '+90 532 111 2233',
        email: 'draft@alanya.test',
      });

      await service.saveDraft(
        {
          name: 'Draft With Phone & Email',
          phone: '+90 532 111 2233',
          email: 'draft@alanya.test',
        },
        [],
        validUserId,
      );

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Draft With Phone & Email',
          phone: '+90 532 111 2233',
          email: 'draft@alanya.test',
        }),
      );
    });

    it('should update an existing draft when valid draftId is provided and user is owner', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validDraftId,
        name: 'Updated Partial Cafe',
        status: 'draft',
        owner_user_id: validUserId,
      });

      const res = await service.saveDraft(
        { name: 'Updated Partial Cafe', tier: 'voyager' },
        [],
        validUserId,
        validDraftId,
      );

      expect(res.name).toBe('Updated Partial Cafe');
      expect(mockRepository.getDirectoryListingOwner).toHaveBeenCalledWith(
        validDraftId,
      );
      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validDraftId,
        expect.objectContaining({
          name: 'Updated Partial Cafe',
          status: 'draft',
          tier: 'voyager',
        }),
      );
    });

    it('should throw UnauthorizedException when attempting to update a draft owned by another user', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: 'other-user-99',
      });

      await expect(
        service.saveDraft(
          { name: 'Hacked Draft' },
          [],
          validUserId,
          validDraftId,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should normalize price_level string to integer in new draft', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: validDraftId,
        name: 'Price Test Draft',
        status: 'draft',
        owner_user_id: validUserId,
        price_level: 3,
      });

      await service.saveDraft(
        { name: 'Price Test Draft', price_level: ' $$$ ' },
        [],
        validUserId,
      );

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          price_level: 3,
        }),
      );
    });

    it('should throw an error if photo gallery exceeds tier limit', async () => {
      const photos = Array(6).fill('https://example.com/p.jpg');
      await expect(
        service.saveDraft(
          { tier: 'explorer', gallery: photos },
          [],
          validUserId,
        ),
      ).rejects.toThrow(/Photo limit exceeded/);
    });
  });

  describe('publishDraft', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate required fields, update status from draft to pending, and save', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        name: 'Alanya Seaside Restaurant',
        category_id: 'restaurants',
        description: 'Fine dining by the sea with Mediterranean flavors.',
        location: 'Damlatas Cad. 10',
        status: 'pending',
        owner_user_id: validUserId,
      });

      const res = await service.publishDraft(
        validListingId,
        {
          name: 'Alanya Seaside Restaurant',
          category_id: 'restaurants',
          description: 'Fine dining by the sea with Mediterranean flavors.',
          location: 'Damlatas Cad. 10',
          email: 'info@seaside.test',
          phone: '+90 242 511 0000',
        },
        [],
        validUserId,
      );

      expect(res.status).toBe('pending');
      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        expect.objectContaining({
          name: 'Alanya Seaside Restaurant',
          status: 'pending',
        }),
      );
    });

    it('should throw error when business name is missing or too short', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });

      await expect(
        service.publishDraft(
          validListingId,
          {
            name: 'A',
            category_id: 'restaurants',
            description: 'A valid description with enough characters.',
            address: 'Alanya Beach',
            email: 'test@example.com',
          },
          [],
          validUserId,
        ),
      ).rejects.toThrow('Business name is required to publish');
    });

    it('should throw error when category is missing', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });

      await expect(
        service.publishDraft(
          validListingId,
          {
            name: 'Valid Name',
            description: 'A valid description with enough characters.',
            address: 'Alanya Beach',
            email: 'test@example.com',
          },
          [],
          validUserId,
        ),
      ).rejects.toThrow('Category is required to publish');
    });

    it('should throw error when email is missing', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });

      await expect(
        service.publishDraft(
          validListingId,
          {
            name: 'Valid Name',
            category_id: 'restaurants',
            description: 'A valid description with enough characters.',
            address: 'Alanya Beach',
            email: '',
          },
          [],
          validUserId,
        ),
      ).rejects.toThrow('Valid email is required to publish');
    });

    it('should normalize string price_level when publishing draft', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        name: 'Valid Name',
        price_level: 2,
      });

      await service.publishDraft(
        validListingId,
        {
          name: 'Valid Name',
          category_id: 'restaurants',
          description: 'Valid description with enough characters.',
          address: 'Alanya Beach',
          email: 'test@example.com',
          price_level: '$$',
        },
        [],
        validUserId,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        expect.objectContaining({
          price_level: 2,
        }),
      );
    });

    it('should omit invalid price_level string when publishing draft', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        name: 'Valid Name',
      });

      await service.publishDraft(
        validListingId,
        {
          name: 'Valid Name',
          category_id: 'restaurants',
          description: 'Valid description with enough characters.',
          address: 'Alanya Beach',
          email: 'test@example.com',
          price_level: '$$$$$',
        },
        [],
        validUserId,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        expect.not.objectContaining({
          price_level: expect.anything(),
        }),
      );
    });

    it('should throw UnauthorizedException if caller is not the owner', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: 'different-user',
      });

      await expect(
        service.publishDraft(
          validListingId,
          {
            name: 'Valid Name',
            category_id: 'restaurants',
            description: 'Valid description',
            address: 'Valid address',
            email: 'test@example.com',
          },
          [],
          validUserId,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createDirectoryListing', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';

    it('should include phone and email in safeData when creating a listing', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        name: 'New Restaurant',
        phone: '+90 242 555 3344',
        email: 'info@restaurant.test',
        status: 'pending',
      });

      await service.createDirectoryListing(
        {
          name: 'New Restaurant',
          category_id: 'restaurants',
          description: 'A great new restaurant in Alanya',
          location: 'Center 1',
          phone: '+90 242 555 3344',
          email: 'info@restaurant.test',
          tier: 'voyager',
        },
        [],
        validUserId,
      );

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Restaurant',
          phone: '+90 242 555 3344',
          email: 'info@restaurant.test',
          status: 'pending',
          tier: 'voyager',
        }),
      );
    });

    it('should set phone and email to null when they are not strings', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        name: 'New Restaurant Without Contacts',
        status: 'pending',
      });

      await service.createDirectoryListing(
        {
          name: 'New Restaurant Without Contacts',
          category_id: 'restaurants',
          tier: 'explorer',
        },
        [],
        validUserId,
      );

      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Restaurant Without Contacts',
          phone: null,
          email: null,
          status: 'pending',
        }),
      );
    });
  });

  describe('updateDirectoryListing', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';

    it('should normalize string price_level when updating listing', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
        price_level: 4,
      });

      await service.updateDirectoryListing(
        validListingId,
        { price_level: '$$$$' },
        [],
        validUserId,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        expect.objectContaining({
          price_level: 4,
        }),
      );
    });

    it('should omit invalid price_level when updating listing', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: validUserId,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: validListingId,
      });

      await service.updateDirectoryListing(
        validListingId,
        { price_level: 'invalid_price' },
        [],
        validUserId,
      );

      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        validListingId,
        expect.not.objectContaining({
          price_level: expect.anything(),
        }),
      );
    });
  });

  describe('getMyDirectoryListings', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should pass status filter to repository when status is provided', async () => {
      mockRepository.getMyDirectoryListings.mockResolvedValueOnce([
        { id: 'draft-1', status: 'draft', owner_user_id: validUserId },
      ]);

      const res = await service.getMyDirectoryListings(validUserId, 'draft');

      expect(res).toHaveLength(1);
      expect(mockRepository.getMyDirectoryListings).toHaveBeenCalledWith(
        validUserId,
        'draft',
      );
    });
  });

  describe('getMyListingClaims', () => {
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should return empty array without querying repository when userId is not a valid UUID', async () => {
      const res = await service.getMyListingClaims('invalid-uuid');
      expect(res).toEqual([]);
      expect(mockRepository.getMyListingClaims).not.toHaveBeenCalled();
    });

    it('should return claims from repository when valid UUID userId is provided', async () => {
      const claims = [
        {
          id: 'claim-1',
          listing_id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: validUserId,
          status: 'pending',
          business_name: 'Seaside Bistro',
        },
      ];
      mockRepository.getMyListingClaims.mockResolvedValueOnce(claims);

      const res = await service.getMyListingClaims(validUserId);
      expect(res).toEqual(claims);
      expect(mockRepository.getMyListingClaims).toHaveBeenCalledWith(
        validUserId,
      );
    });
  });
});
