import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';

describe('DirectoryService', () => {
  let service: DirectoryService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getDirectoryListings: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      searchDirectoryListings: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getFreeListings: jest.fn().mockResolvedValue([]),
      getPremiumListings: jest.fn().mockResolvedValue([]),
      getSignatureListings: jest.fn().mockResolvedValue([]),
      getRecentlyClaimedListings: jest.fn().mockResolvedValue([]),
      getDirectoryListingBySlug: jest.fn(),
      getDirectoryListingById: jest.fn(),
      getUserRole: jest.fn(),
      updateListingStatus: jest.fn(),
      insertDirectoryListing: jest.fn(),
      updateDirectoryListing: jest.fn(),
      deleteDirectoryListing: jest.fn(),
      trackListingView: jest.fn().mockResolvedValue({ success: true }),
      trackListingClick: jest.fn().mockResolvedValue({ success: true }),
      voteForListing: jest.fn(),
      getUserVotesBatch: jest.fn().mockResolvedValue([]),
      deleteListingVote: jest.fn().mockResolvedValue({ success: true }),
      invokeFunction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryService,
        {
          provide: DirectoryRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DirectoryService>(DirectoryService);
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.approveDirectoryListing('dir-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call repository updateListingStatus when user is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      expect(mockRepository.invokeFunction).toHaveBeenCalledWith('send-email', expect.any(Object));
    });
  });

  describe('voteForListing', () => {
    it('should call repository voteForListing', async () => {
      mockRepository.voteForListing.mockResolvedValueOnce([
        { net_votes: 5, user_vote: 1 },
      ]);

      const res = await service.voteForListing('dir-1', 1, 'user-1');
      expect(res).toEqual({ netVotes: 5, userVote: 1 });
      expect(mockRepository.voteForListing).toHaveBeenCalledWith(
        'dir-1',
        1,
        'user-1',
      );
    });
  });
});
