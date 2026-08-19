import { Test, TestingModule } from '@nestjs/testing';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from './directory.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from './types/directory.types';

describe('DirectoryController', () => {
  let controller: DirectoryController;
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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectoryController],
      providers: [
        {
          provide: DirectoryService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DirectoryController>(DirectoryController);
  });

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

  it('should pass req.user.id to approveDirectoryListing', async () => {
    const req = { user: { id: 'admin-77' } } as AuthenticatedRequest;
    await controller.approveDirectoryListing('dir-9', req);
    expect(mockService.approveDirectoryListing).toHaveBeenCalledWith(
      'dir-9',
      'admin-77',
    );
  });

  it('should pass req.user.id to voteForListing', async () => {
    const req = { user: { id: 'usr-88' } } as AuthenticatedRequest;
    await controller.voteForListing('dir-9', 1, req);
    expect(mockService.voteForListing).toHaveBeenCalledWith(
      'dir-9',
      1,
      'usr-88',
    );
  });
});
