import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { REVIEWS_REPOSITORY } from './domain/repositories/reviews.repository.interface';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockUserRolesRepo: {
    getRole: jest.Mock;
  };
  let mockRepository: {
    findById: jest.Mock;
    save: jest.Mock;
    getListingReviews: jest.Mock;
    insertListingReview: jest.Mock;
    getUserReviewForListing: jest.Mock;
    getReviewsByStatus: jest.Mock;
    updateReviewStatus: jest.Mock;
    deleteReview: jest.Mock;
  };

  beforeEach(async () => {
    mockUserRolesRepo = {
      getRole: jest.fn(),
    };
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      getListingReviews: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      insertListingReview: jest.fn().mockResolvedValue({ id: 'r-1' }),
      getUserReviewForListing: jest.fn().mockResolvedValue(null),
      getReviewsByStatus: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      updateReviewStatus: jest.fn().mockResolvedValue(undefined),
      deleteReview: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: REVIEWS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: UserRolesRepository,
          useValue: mockUserRolesRepo,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('getListingReviews', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should calculate offset range (from/to) and return formatted response for valid UUID', async () => {
      mockRepository.getListingReviews.mockResolvedValueOnce({
        data: [{ id: 'r1', rating: 5 }],
        count: 1,
      });

      const res = await service.getListingReviews(validUuid, 2, 10);
      expect(res).toEqual({ data: [{ id: 'r1', rating: 5 }], total: 1 });
      expect(mockRepository.getListingReviews).toHaveBeenCalledWith(
        validUuid,
        10,
        19,
      );
    });

    it('should return empty paginated result { data: [], total: 0 } when listingId is not a valid UUID (e.g. biz-003)', async () => {
      const res = await service.getListingReviews('biz-003', 1, 20);
      expect(res).toEqual({ data: [], total: 0 });
      expect(mockRepository.getListingReviews).not.toHaveBeenCalled();
    });

    it('should use default page=1 and limit=20 if omitted for valid UUID', async () => {
      mockRepository.getListingReviews.mockResolvedValueOnce({
        data: [],
        count: 0,
      });

      await service.getListingReviews(validUuid);
      expect(mockRepository.getListingReviews).toHaveBeenCalledWith(
        validUuid,
        0,
        19,
      );
    });
  });

  describe('submitListingReview', () => {
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should delegate to repository insertListingReview for valid UUIDs', async () => {
      mockRepository.insertListingReview.mockResolvedValueOnce({ id: 'r-new' });

      const res = await service.submitListingReview(
        validListingId,
        5,
        'Great place!',
        validUserId,
      );
      expect(res).toEqual({ id: 'r-new' });
      expect(mockRepository.insertListingReview).toHaveBeenCalledWith(
        validListingId,
        5,
        'Great place!',
        validUserId,
      );
    });

    it('should return empty object without querying repository when listingId is not a valid UUID (e.g. biz-003)', async () => {
      const res = await service.submitListingReview(
        'biz-003',
        5,
        'Great place!',
        validUserId,
      );
      expect(res).toEqual({});
      expect(mockRepository.insertListingReview).not.toHaveBeenCalled();
    });

    it('should return empty object without querying repository when userId is not a valid UUID', async () => {
      const res = await service.submitListingReview(
        validListingId,
        5,
        'Great place!',
        'invalid-user',
      );
      expect(res).toEqual({});
      expect(mockRepository.insertListingReview).not.toHaveBeenCalled();
    });
  });

  describe('getUserReviewForListing', () => {
    const validListingId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '223e4567-e89b-12d3-a456-426614174001';

    it('should return user review if found for valid UUIDs', async () => {
      mockRepository.getUserReviewForListing.mockResolvedValueOnce({
        id: 'rev-user-1',
        rating: 4,
      });

      const res = await service.getUserReviewForListing(
        validListingId,
        validUserId,
      );
      expect(res).toEqual({ id: 'rev-user-1', rating: 4 });
      expect(mockRepository.getUserReviewForListing).toHaveBeenCalledWith(
        validListingId,
        validUserId,
      );
    });

    it('should return null if user review is not found for valid UUIDs', async () => {
      mockRepository.getUserReviewForListing.mockResolvedValueOnce(null);

      const res = await service.getUserReviewForListing(
        validListingId,
        validUserId,
      );
      expect(res).toBeNull();
    });

    it('should return null without querying repository when listingId is not a valid UUID (e.g. biz-003)', async () => {
      const res = await service.getUserReviewForListing('biz-003', validUserId);
      expect(res).toBeNull();
      expect(mockRepository.getUserReviewForListing).not.toHaveBeenCalled();
    });

    it('should return null without querying repository when userId is not a valid UUID', async () => {
      const res = await service.getUserReviewForListing(
        validListingId,
        'invalid-user-id',
      );
      expect(res).toBeNull();
      expect(mockRepository.getUserReviewForListing).not.toHaveBeenCalled();
    });
  });

  describe('getPendingReviews', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(service.getPendingReviews(1, 50, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fetch pending reviews if caller is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getReviewsByStatus.mockResolvedValueOnce({
        data: [{ id: 'p1' }],
        count: 1,
      });

      const res = await service.getPendingReviews(1, 50, 'admin-1');
      expect(res).toEqual({ data: [{ id: 'p1' }], total: 1 });
      expect(mockRepository.getReviewsByStatus).toHaveBeenCalledWith(
        'pending',
        0,
        49,
        true,
      );
    });
  });

  describe('getReviewsByStatus', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.getReviewsByStatus('approved', 1, 50, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fetch reviews by status if caller is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');
      mockRepository.getReviewsByStatus.mockResolvedValueOnce({
        data: [{ id: 'a1' }],
        count: 1,
      });

      const res = await service.getReviewsByStatus(
        'approved',
        2,
        25,
        'admin-1',
      );
      expect(res).toEqual({ data: [{ id: 'a1' }], total: 1 });
      expect(mockRepository.getReviewsByStatus).toHaveBeenCalledWith(
        'approved',
        25,
        49,
        false,
      );
    });
  });

  describe('approveReview', () => {
    const validReviewId = '123e4567-e89b-12d3-a456-426614174000';
    const validAdminId = '223e4567-e89b-12d3-a456-426614174001';

    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.approveReview(validReviewId, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call repository updateReviewStatus when caller is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.approveReview(validReviewId, validAdminId);
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateReviewStatus).toHaveBeenCalledWith(
        validReviewId,
        'approved',
      );
    });

    it('should return success false without calling repository when review id is not a valid UUID', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.approveReview('invalid-rev-id', validAdminId);
      expect(res).toEqual({ success: false });
      expect(mockRepository.updateReviewStatus).not.toHaveBeenCalled();
    });
  });

  describe('rejectReview', () => {
    const validReviewId = '123e4567-e89b-12d3-a456-426614174000';
    const validAdminId = '223e4567-e89b-12d3-a456-426614174001';

    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.rejectReview(validReviewId, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call repository updateReviewStatus with rejected when caller is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.rejectReview(validReviewId, validAdminId);
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateReviewStatus).toHaveBeenCalledWith(
        validReviewId,
        'rejected',
      );
    });

    it('should return success false without calling repository when review id is not a valid UUID', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.rejectReview('invalid-rev-id', validAdminId);
      expect(res).toEqual({ success: false });
      expect(mockRepository.updateReviewStatus).not.toHaveBeenCalled();
    });
  });

  describe('deleteReview', () => {
    const validReviewId = '123e4567-e89b-12d3-a456-426614174000';
    const validAdminId = '223e4567-e89b-12d3-a456-426614174001';

    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('user');

      await expect(
        service.deleteReview(validReviewId, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should call repository deleteReview when caller is admin', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.deleteReview(validReviewId, validAdminId);
      expect(res).toEqual({ success: true });
      expect(mockRepository.deleteReview).toHaveBeenCalledWith(validReviewId);
    });

    it('should return success false without calling repository when review id is not a valid UUID', async () => {
      mockUserRolesRepo.getRole.mockResolvedValueOnce('admin');

      const res = await service.deleteReview('invalid-rev-id', validAdminId);
      expect(res).toEqual({ success: false });
      expect(mockRepository.deleteReview).not.toHaveBeenCalled();
    });
  });
});
