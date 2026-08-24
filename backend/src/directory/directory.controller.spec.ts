import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryController } from './directory.controller';
import { DirectoryAdminController } from './presentation/directory-admin.controller';
import { DirectoryService } from './directory.service';
import { DirectoryListingService } from './application/directory-listing.service';
import { ListingClaimService } from './application/listing-claim.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../auth/types/auth-user.interface';

describe('DirectoryController & DirectoryAdminController', () => {
  let controller: DirectoryController;
  let adminController: DirectoryAdminController;
  let mockService: Record<keyof DirectoryService, jest.Mock>;

  beforeEach(async () => {
    mockService = {
      getDirectoryListings: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      searchDirectoryListings: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0 }),
      getFreeListings: jest.fn().mockResolvedValue([]),
      getPremiumListings: jest.fn().mockResolvedValue([]),
      getSignatureListings: jest.fn().mockResolvedValue([]),
      getRecentlyClaimedListings: jest.fn().mockResolvedValue([]),
      getDirectoryListingsAdmin: jest
        .fn()
        .mockResolvedValue({ data: [], total: 0 }),
      getDirectoryListingsByStatus: jest.fn().mockResolvedValue([]),
      getPendingDirectoryListings: jest.fn().mockResolvedValue([]),
      approveDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
      rejectDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
      getDirectoryAnalyticsForOwner: jest.fn().mockResolvedValue([]),
      getCategoryAnalyticsAverage: jest.fn().mockResolvedValue({}),
      trackListingView: jest.fn().mockResolvedValue({ success: true }),
      trackListingClick: jest.fn().mockResolvedValue({ success: true }),
      voteForListing: jest.fn().mockResolvedValue({ success: true }),
      getUserVotesBatch: jest.fn().mockResolvedValue([]),
      removeListingVote: jest.fn().mockResolvedValue({ success: true }),
      submitListingClaim: jest.fn().mockResolvedValue({ success: true }),
      verifyClaimEmail: jest.fn().mockResolvedValue({ success: true }),
      getListingClaims: jest.fn().mockResolvedValue([]),
      approveListingClaim: jest.fn().mockResolvedValue({ success: true }),
      rejectListingClaim: jest.fn().mockResolvedValue({ success: true }),
      getListingAddons: jest.fn().mockResolvedValue([]),
      createAddonCheckout: jest
        .fn()
        .mockResolvedValue({ url: 'http://checkout' }),
      sendListingPaymentInstructions: jest
        .fn()
        .mockResolvedValue({ success: true }),
      getMyDirectoryListings: jest.fn().mockResolvedValue([]),
      getDirectoryListingBySlug: jest.fn().mockResolvedValue({ id: 'd1' }),
      getDirectoryListingsByCategory: jest.fn().mockResolvedValue([]),
      getDirectoryListing: jest.fn().mockResolvedValue({ id: 'd1' }),
      createDirectoryListing: jest.fn().mockResolvedValue({ id: 'd1' }),
      updateDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
      deleteDirectoryListing: jest.fn().mockResolvedValue({ success: true }),
      saveDraft: jest
        .fn()
        .mockResolvedValue({ id: 'draft-1', status: 'draft' }),
      publishDraft: jest
        .fn()
        .mockResolvedValue({ id: 'draft-1', status: 'pending' }),
      getMyListingClaims: jest.fn().mockResolvedValue([]),
      featureListing: jest
        .fn()
        .mockResolvedValue({ success: true, is_featured: true }),
      unfeatureListing: jest
        .fn()
        .mockResolvedValue({ success: true, is_featured: false }),
      verifyListing: jest
        .fn()
        .mockResolvedValue({ success: true, is_verified: true }),
      unverifyListing: jest
        .fn()
        .mockResolvedValue({ success: true, is_verified: false }),
      setListingScore: jest
        .fn()
        .mockResolvedValue({ success: true, base_score: 80 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryController, DirectoryAdminController],
      providers: [
        {
          provide: DirectoryService,
          useValue: mockService,
        },
        {
          provide: DirectoryListingService,
          useValue: mockService,
        },
        {
          provide: ListingClaimService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DirectoryController>(DirectoryController);
    adminController = module.get<DirectoryAdminController>(
      DirectoryAdminController,
    );
  });

  describe('DirectoryController (Public & Owner)', () => {
    it('should pass query parameters to searchDirectoryListings', async () => {
      await controller.searchDirectoryListings(
        'beach',
        'cat-1',
        'Alanya',
        '2',
        '20',
      );
      expect(mockService.searchDirectoryListings).toHaveBeenCalledWith(
        'beach',
        'cat-1',
        'Alanya',
        2,
        20,
      );
    });

    it('should delegate getFreeListings to service', async () => {
      await controller.getFreeListings();
      expect(mockService.getFreeListings).toHaveBeenCalled();
    });

    it('should pass req.user.id to voteForListing', async () => {
      const user: AuthUser = { id: 'usr-88' };
      await controller.voteForListing('dir-9', 1, user);
      expect(mockService.voteForListing).toHaveBeenCalledWith(
        'dir-9',
        1,
        'usr-88',
      );
    });

    it('should handle saveDraft via POST /directory/draft', async () => {
      const user: AuthUser = { id: 'usr-123' };
      const draftPayload = {
        name: 'Partial Cafe',
        category: 'restaurants',
        locationIds: ['loc-1'],
        draftId: 'draft-99',
      };

      const res = await controller.saveDraft(draftPayload, user);
      expect(res).toEqual({ id: 'draft-1', status: 'draft' });
      expect(mockService.saveDraft).toHaveBeenCalledWith(
        draftPayload,
        ['loc-1'],
        'usr-123',
        'draft-99',
      );
    });

    it('should handle publishDraft via POST /directory/:id/publish', async () => {
      const user: AuthUser = { id: 'usr-123' };
      const publishPayload = {
        name: 'Complete Cafe',
        category: 'restaurants',
        description: 'Fully detailed description.',
        location: 'Alanya Port',
        email: 'info@complete.test',
        locationIds: ['loc-1'],
      };

      const res = await controller.publishDraft(
        'draft-99',
        publishPayload,
        user,
      );
      expect(res).toEqual({ id: 'draft-1', status: 'pending' });
      expect(mockService.publishDraft).toHaveBeenCalledWith(
        'draft-99',
        publishPayload,
        ['loc-1'],
        'usr-123',
      );
    });

    it('should pass status query parameter to getMyDirectoryListings', async () => {
      const user: AuthUser = { id: 'usr-123' };
      await controller.getMyDirectoryListings(user, 'draft');
      expect(mockService.getMyDirectoryListings).toHaveBeenCalledWith(
        'usr-123',
        'draft',
      );
    });

    it('should pass req.user.id to getMyListingClaims', async () => {
      const user: AuthUser = { id: 'usr-claimant-1' };
      const claims = [
        { id: 'claim-1', business_name: 'Test Biz', status: 'pending' },
      ];
      mockService.getMyListingClaims.mockResolvedValueOnce(claims);

      const result = await controller.getMyListingClaims(user);
      expect(result).toEqual(claims);
      expect(mockService.getMyListingClaims).toHaveBeenCalledWith(
        'usr-claimant-1',
      );
    });

    it('should delegate getDirectoryListings with parsed parameters', async () => {
      await controller.getDirectoryListings('2', '10', 'hotels', 'rating');
      expect(mockService.getDirectoryListings).toHaveBeenCalledWith(
        2,
        10,
        'hotels',
        'rating',
      );
    });

    it('should delegate getRestaurantsListings', async () => {
      await controller.getRestaurantsListings('1', '20');
      expect(mockService.getDirectoryListings).toHaveBeenCalledWith(
        1,
        20,
        'restaurants',
      );
    });

    it('should pass req.user.id to deleteDirectoryListing', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await controller.deleteDirectoryListing('dir-1', adminUser);
      expect(mockService.deleteDirectoryListing).toHaveBeenCalledWith(
        'dir-1',
        'admin-1',
      );
    });

    it('should pass parsed days and req.user.id to getDirectoryAnalyticsForOwner', async () => {
      const ownerUser: AuthUser = { id: 'owner-1' };
      await controller.getDirectoryAnalyticsForOwner('60', ownerUser);
      expect(mockService.getDirectoryAnalyticsForOwner).toHaveBeenCalledWith(
        60,
        'owner-1',
      );
    });

    it('should delegate getListingAddons', async () => {
      await controller.getListingAddons('dir-1');
      expect(mockService.getListingAddons).toHaveBeenCalledWith('dir-1');
    });

    it('should pass req.user.id to createAddonCheckout', async () => {
      const ownerUser: AuthUser = { id: 'owner-1' };
      await controller.createAddonCheckout(
        'dir-1',
        'featured_badge',
        ownerUser,
      );
      expect(mockService.createAddonCheckout).toHaveBeenCalledWith(
        'dir-1',
        'featured_badge',
        'owner-1',
      );
    });
  });

  describe('DirectoryAdminController (Admin Moderation)', () => {
    it('should pass filters and req.user.id to getDirectoryListingsAdmin', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await adminController.getDirectoryListingsAdmin(
        'pending',
        'hotels',
        undefined,
        'sunset',
        adminUser,
      );
      expect(mockService.getDirectoryListingsAdmin).toHaveBeenCalledWith(
        { status: 'pending', category: 'hotels', query: 'sunset' },
        'admin-1',
      );
    });

    it('should pass req.user.id to approveDirectoryListing', async () => {
      const user: AuthUser = { id: 'admin-77' };
      await adminController.approveDirectoryListing('dir-9', user);
      expect(mockService.approveDirectoryListing).toHaveBeenCalledWith(
        'dir-9',
        'admin-77',
      );
    });

    it('should pass reason and req.user.id to rejectDirectoryListing', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await adminController.rejectDirectoryListing(
        'dir-1',
        'Invalid info',
        adminUser,
      );
      expect(mockService.rejectDirectoryListing).toHaveBeenCalledWith(
        'dir-1',
        'Invalid info',
        'admin-1',
      );
    });

    it('should delegate getListingClaims to listingClaimService', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await adminController.getListingClaims(adminUser);
      expect(mockService.getListingClaims).toHaveBeenCalledWith('admin-1');
    });

    it('should delegate approveListingClaim to listingClaimService', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await adminController.approveListingClaim('claim-1', adminUser);
      expect(mockService.approveListingClaim).toHaveBeenCalledWith(
        'claim-1',
        'admin-1',
      );
    });

    it('should delegate rejectListingClaim to listingClaimService', async () => {
      const adminUser: AuthUser = { id: 'admin-1', role: 'admin' };
      await adminController.rejectListingClaim(
        'claim-1',
        'Invalid license',
        adminUser,
      );
      expect(mockService.rejectListingClaim).toHaveBeenCalledWith(
        'claim-1',
        'Invalid license',
        'admin-1',
      );
    });
  });
});
