import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';
import { RedisService } from '../common/redis/redis.service';

describe('DirectoryService', () => {
  let service: DirectoryService;
  let mockRepository: {
    getDirectoryListings: jest.Mock;
    searchDirectoryListings: jest.Mock;
    getFreeListings: jest.Mock;
    getPremiumListings: jest.Mock;
    getSignatureListings: jest.Mock;
    getRecentlyClaimedListings: jest.Mock;
    getDirectoryListingBySlug: jest.Mock;
    getDirectoryListingById: jest.Mock;
    getUserRole: jest.Mock;
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
  };

  beforeEach(async () => {
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
      getUserRole: jest.fn(),
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectoryService,
        {
          provide: DirectoryRepository,
          useValue: mockRepository,
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
      expect(mockRepository.invokeFunction).toHaveBeenCalledWith(
        'send-email',
        expect.any(Object),
      );
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

    it('should return default 0 votes when repository returns empty array', async () => {
      mockRepository.voteForListing.mockResolvedValueOnce([]);

      const res = await service.voteForListing('dir-1', 1, 'user-1');
      expect(res).toEqual({ netVotes: 0, userVote: 0 });
    });
  });

  describe('removeListingVote', () => {
    it('should call repository removeListingVote and return netVotes', async () => {
      mockRepository.removeListingVote.mockResolvedValueOnce([
        { net_votes: 3 },
      ]);

      const res = await service.removeListingVote('dir-1', 'user-1');
      expect(res).toEqual({ netVotes: 3 });
      expect(mockRepository.removeListingVote).toHaveBeenCalledWith(
        'dir-1',
        'user-1',
      );
    });

    it('should return 0 netVotes when repository returns empty array', async () => {
      mockRepository.removeListingVote.mockResolvedValueOnce([]);

      const res = await service.removeListingVote('dir-1', 'user-1');
      expect(res).toEqual({ netVotes: 0 });
    });
  });

  describe('approveListingClaim', () => {
    it('should throw UnauthorizedException if non-admin attempts claim approval', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.approveListingClaim('claim-1', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should approve claim and dispatch email notification when successful', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.rejectListingClaim('claim-1', 'Invalid documents', 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject claim and dispatch email notification when successful', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
      mockRepository.callRejectListingClaimRpc.mockResolvedValueOnce({
        data: [{ success: false, message: 'Claim not found or invalid' }],
        error: null,
      });

      await expect(
        service.rejectListingClaim('claim-1', 'Invalid docs', 'admin-1'),
      ).rejects.toThrow('Claim not found or invalid');
    });
  });
});
