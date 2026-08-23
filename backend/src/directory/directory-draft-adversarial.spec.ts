import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { RedisService } from '../common/redis/redis.service';
import { DirectoryController } from './directory.controller';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('Empirical Adversarial Verification: Directory Listing Drafts System', () => {
  let service: DirectoryService;
  let controller: DirectoryController;
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
    getDirectoryListingsByCategory: jest.Mock;
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
  };

  const userA = '11111111-1111-4111-a111-111111111111';
  const userB = '22222222-2222-4222-a222-222222222222';
  const draftId1 = '33333333-3333-4333-a333-333333333333';
  const locId1 = '44444444-4444-4444-a444-444444444444';
  const locId2 = '55555555-5555-4555-a555-555555555555';

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
      getDirectoryListingsByCategory: jest.fn().mockResolvedValue([]),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryController],
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
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    service = module.get<DirectoryService>(DirectoryService);
    controller = module.get<DirectoryController>(DirectoryController);
  });

  describe('Requirement 1: Saving partial drafts with only 1 field', () => {
    it('1.1 should save draft with ONLY name provided', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Single Field Name Only',
        status: 'draft',
        owner_user_id: userA,
      });

      const res = await service.saveDraft(
        { name: 'Single Field Name Only' },
        [],
        userA,
      );

      expect(res.id).toBe(draftId1);
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Single Field Name Only',
          status: 'draft',
          owner_user_id: userA,
          short_description: '',
          description: null,
          category_id: null,
          is_featured: false,
          is_verified: false,
          is_premium: false,
          base_score: 0,
          tier: 'explorer',
        }),
      );
    });

    it('1.2 should save draft with totally empty body (defaults to "Untitled Draft")', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Untitled Draft',
        status: 'draft',
        owner_user_id: userA,
      });

      const res = await service.saveDraft({}, [], userA);

      expect(res.name).toBe('Untitled Draft');
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Untitled Draft',
          status: 'draft',
          owner_user_id: userA,
        }),
      );
    });

    it('1.3 should save draft with ONLY category provided', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Untitled Draft',
        category_id: 'restaurants',
        status: 'draft',
        owner_user_id: userA,
      });

      const res = await service.saveDraft(
        { category: 'restaurants' },
        [],
        userA,
      );

      expect(res.status).toBe('draft');
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Untitled Draft',
          category_id: 'restaurants',
          status: 'draft',
          owner_user_id: userA,
        }),
      );
    });

    it('1.4 should save draft with ONLY phone / whatsapp provided', async () => {
      mockRepository.insertDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Untitled Draft',
        whatsapp: '+905551234567',
        status: 'draft',
        owner_user_id: userA,
      });

      const res = await service.saveDraft(
        { whatsapp: '+905551234567' },
        [],
        userA,
      );

      expect(res.status).toBe('draft');
      expect(mockRepository.insertDirectoryListing).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsapp: '+905551234567',
          status: 'draft',
          owner_user_id: userA,
        }),
      );
    });
  });

  describe('Requirement 2: Updating existing drafts', () => {
    it('2.1 should update an existing draft owned by user', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userA,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Progressively Updated Name',
        short_description: 'Added short desc',
        status: 'draft',
        owner_user_id: userA,
      });

      const res = await service.saveDraft(
        {
          name: 'Progressively Updated Name',
          short_description: 'Added short desc',
          tier: 'voyager',
        },
        [locId1],
        userA,
        draftId1,
      );

      expect(res.name).toBe('Progressively Updated Name');
      expect(mockRepository.getDirectoryListingOwner).toHaveBeenCalledWith(
        draftId1,
      );
      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        draftId1,
        expect.objectContaining({
          name: 'Progressively Updated Name',
          short_description: 'Added short desc',
          tier: 'voyager',
          status: 'draft',
        }),
      );
      expect(mockRepository.upsertListingLocations).toHaveBeenCalledWith([
        { listing_id: draftId1, location_id: locId1, display_order: 0 },
      ]);
    });

    it('2.2 should reject photos exceeding tier limit during draft update', async () => {
      const photos = Array(6).fill('https://example.com/photo.jpg');
      await expect(
        service.saveDraft(
          { tier: 'explorer', gallery: photos },
          [],
          userA,
          draftId1,
        ),
      ).rejects.toThrow('Photo limit exceeded for explorer tier: max 5 photos');
    });

    it('2.3 should allow up to 50 photos when tier is voyager', async () => {
      const photos = Array(50).fill('https://example.com/photo.jpg');
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userA,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        gallery: photos,
        tier: 'voyager',
      });

      const res = await service.saveDraft(
        { tier: 'voyager', gallery: photos },
        [],
        userA,
        draftId1,
      );
      expect(res.tier).toBe('voyager');
    });
  });

  describe('Requirement 3: Attempting to publish an incomplete draft (rejected with validation error)', () => {
    beforeEach(() => {
      mockRepository.getDirectoryListingOwner.mockResolvedValue({
        owner_user_id: userA,
      });
    });

    it('3.1 should reject publishing if name is empty or shorter than 2 chars', async () => {
      await expect(
        service.publishDraft(
          draftId1,
          {
            name: '',
            category: 'restaurants',
            description: 'Valid description with sufficient details.',
            address: 'Damlatas St.',
            email: 'test@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Business name is required to publish');

      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'A',
            category: 'restaurants',
            description: 'Valid description with sufficient details.',
            address: 'Damlatas St.',
            email: 'test@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Business name is required to publish');
    });

    it('3.2 should reject publishing if category is missing', async () => {
      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Alanya Fish House',
            description: 'Fresh seafood restaurant.',
            address: 'Damlatas St.',
            email: 'test@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Category is required to publish');
    });

    it('3.3 should reject publishing if description is missing or blank', async () => {
      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Alanya Fish House',
            category: 'restaurants',
            description: '   ',
            address: 'Damlatas St.',
            email: 'test@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Description is required to publish');
    });

    it('3.4 should reject publishing if address/location is missing or blank', async () => {
      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Alanya Fish House',
            category: 'restaurants',
            description: 'Fresh seafood restaurant.',
            location: '   ',
            email: 'test@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Address is required to publish');
    });

    it('3.5 should reject publishing if email is missing or formatted invalidly', async () => {
      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Alanya Fish House',
            category: 'restaurants',
            description: 'Fresh seafood restaurant.',
            address: 'Damlatas St.',
            email: 'invalid-email-string',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Valid email is required to publish');

      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Alanya Fish House',
            category: 'restaurants',
            description: 'Fresh seafood restaurant.',
            address: 'Damlatas St.',
            email: '',
          },
          [],
          userA,
        ),
      ).rejects.toThrow('Valid email is required to publish');
    });

    it('3.6 should successfully publish when all required fields are valid and transition status to pending', async () => {
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Alanya Fish House',
        category_id: 'restaurants',
        description: 'Fresh seafood restaurant.',
        location: 'Damlatas St.',
        email: 'info@alanya-fish.test',
        status: 'pending',
      });

      const res = await service.publishDraft(
        draftId1,
        {
          name: 'Alanya Fish House',
          category_id: 'restaurants',
          description: 'Fresh seafood restaurant.',
          address: 'Damlatas St.',
          email: 'info@alanya-fish.test',
        },
        [locId1, locId2],
        userA,
      );

      expect(res.status).toBe('pending');
      expect(mockRepository.updateDirectoryListing).toHaveBeenCalledWith(
        draftId1,
        expect.objectContaining({
          name: 'Alanya Fish House',
          category_id: 'restaurants',
          description: 'Fresh seafood restaurant.',
          location: 'Damlatas St.',
          email: 'info@alanya-fish.test',
          status: 'pending',
          rejection_reason: null,
        }),
      );
      expect(mockRepository.upsertListingLocations).toHaveBeenCalledWith([
        { listing_id: draftId1, location_id: locId1, display_order: 0 },
        { listing_id: draftId1, location_id: locId2, display_order: 1 },
      ]);
    });
  });

  describe("Requirement 4: Attempting to update/publish another user's draft (rejected with 403 Forbidden / UnauthorizedException)", () => {
    it('4.1 should reject saveDraft if draft is owned by another user', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userB,
      });

      await expect(
        service.saveDraft({ name: 'Malicious Hijack' }, [], userA, draftId1),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('4.2 should reject saveDraft if draft does not exist in DB', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce(null);

      await expect(
        service.saveDraft(
          { name: 'Malicious Insert on Non-existent' },
          [],
          userA,
          draftId1,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('4.3 should reject publishDraft if draft is owned by another user', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userB,
      });

      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Valid Name',
            category_id: 'restaurants',
            description: 'Valid Description',
            address: 'Valid Address',
            email: 'valid@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('4.4 should reject publishDraft if draft does not exist', async () => {
      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce(null);

      await expect(
        service.publishDraft(
          draftId1,
          {
            name: 'Valid Name',
            category_id: 'restaurants',
            description: 'Valid Description',
            address: 'Valid Address',
            email: 'valid@example.com',
          },
          [],
          userA,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("Requirement 5: Public query methods to confirm status 'draft' is never returned to unauthenticated/public queries", () => {
    it('5.1 getDirectoryListings should only return approved listings', async () => {
      mockRepository.getDirectoryListings.mockResolvedValueOnce({
        data: [{ id: 'approved-1', status: 'approved' }],
        count: 1,
      });

      const res = await service.getDirectoryListings(1, 20);
      expect(res.data[0].status).toBe('approved');
      expect(mockRepository.getDirectoryListings).toHaveBeenCalledWith(
        1,
        20,
        undefined,
        'base_score',
      );
    });

    it('5.2 searchDirectoryListings should only query approved listings', async () => {
      mockRepository.searchDirectoryListings.mockResolvedValueOnce({
        data: [{ id: 'approved-1', status: 'approved' }],
        count: 1,
      });

      const res = await service.searchDirectoryListings('cafe');
      expect(res.data[0].status).toBe('approved');
      expect(mockRepository.searchDirectoryListings).toHaveBeenCalledWith(
        'cafe',
        undefined,
        undefined,
        1,
        40,
      );
    });

    it('5.3 getFreeListings, getPremiumListings, getSignatureListings should only return approved listings', async () => {
      await service.getFreeListings();
      expect(mockRepository.getFreeListings).toHaveBeenCalled();

      await service.getPremiumListings();
      expect(mockRepository.getPremiumListings).toHaveBeenCalled();

      await service.getSignatureListings();
      expect(mockRepository.getSignatureListings).toHaveBeenCalled();
    });

    it('5.4 getMyDirectoryListings isolates owner listings and supports filtering by status="draft"', async () => {
      mockRepository.getMyDirectoryListings.mockResolvedValueOnce([
        {
          id: draftId1,
          name: 'My Private Draft',
          status: 'draft',
          owner_user_id: userA,
        },
      ]);

      const res = await service.getMyDirectoryListings(userA, 'draft');
      expect(res).toHaveLength(1);
      expect(res[0].status).toBe('draft');
      expect(res[0].owner_user_id).toBe(userA);
      expect(mockRepository.getMyDirectoryListings).toHaveBeenCalledWith(
        userA,
        'draft',
      );
    });
  });

  describe('Controller Contract Verification', () => {
    it('POST /directory/draft delegates to service.saveDraft with auth user', async () => {
      const user: AuthUser = { id: userA };
      const draftDto = {
        name: 'Controller Draft',
        category: 'hotels',
        locationIds: [locId1],
        draftId: draftId1,
      };

      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userA,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Controller Draft',
        status: 'draft',
      });

      const res = await controller.saveDraft(draftDto, user);
      expect(res).toEqual(
        expect.objectContaining({
          id: draftId1,
          name: 'Controller Draft',
          status: 'draft',
        }),
      );
    });

    it('POST /directory/:id/publish delegates to service.publishDraft with auth user', async () => {
      const user: AuthUser = { id: userA };
      const publishBody = {
        name: 'Controller Complete',
        category: 'hotels',
        description: 'Complete hotel description with all amenities.',
        location: 'Kleopatra Beach No: 5',
        email: 'hotel@kleopatra.test',
        locationIds: [locId1],
      };

      mockRepository.getDirectoryListingOwner.mockResolvedValueOnce({
        owner_user_id: userA,
      });
      mockRepository.updateDirectoryListing.mockResolvedValueOnce({
        id: draftId1,
        name: 'Controller Complete',
        status: 'pending',
      });

      const res = await controller.publishDraft(draftId1, publishBody, user);
      expect(res).toEqual(
        expect.objectContaining({
          id: draftId1,
          status: 'pending',
        }),
      );
    });

    it('GET /directory/me/listings?status=draft passes filter to service', async () => {
      const user: AuthUser = { id: userA };
      mockRepository.getMyDirectoryListings.mockResolvedValueOnce([
        { id: draftId1, status: 'draft', owner_user_id: userA },
      ]);

      const res = await controller.getMyDirectoryListings(user, 'draft');
      expect(res).toEqual([
        expect.objectContaining({ id: draftId1, status: 'draft' }),
      ]);
    });
  });
});
