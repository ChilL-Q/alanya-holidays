import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { REVIEWS_REPOSITORY } from './domain/repositories/reviews.repository.interface';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockRepository: {
    findById: jest.Mock;
    save: jest.Mock;
    getListingReviews: jest.Mock;
    insertListingReview: jest.Mock;
    getUserReviewForListing: jest.Mock;
    getUserRole: jest.Mock;
    getReviewsByStatus: jest.Mock;
    updateReviewStatus: jest.Mock;
    deleteReview: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      getListingReviews: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      insertListingReview: jest.fn().mockResolvedValue({ id: 'r-1' }),
      getUserReviewForListing: jest.fn().mockResolvedValue(null),
      getUserRole: jest.fn(),
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
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('getListingReviews', () => {
    it('should calculate offset range (from/to) and return formatted response', async () => {
      mockRepository.getListingReviews.mockResolvedValueOnce({
        data: [{ id: 'r1', rating: 5 }],
        count: 1,
      });

      const res = await service.getListingReviews('list-1', 2, 10);
      expect(res).toEqual({ data: [{ id: 'r1', rating: 5 }], total: 1 });
      expect(mockRepository.getListingReviews).toHaveBeenCalledWith(
        'list-1',
        10,
        19,
      );
    });

    it('should use default page=1 and limit=20 if omitted', async () => {
      mockRepository.getListingReviews.mockResolvedValueOnce({
        data: [],
        count: 0,
      });

      await service.getListingReviews('list-1');
      expect(mockRepository.getListingReviews).toHaveBeenCalledWith(
        'list-1',
        0,
        19,
      );
    });
  });

  describe('submitListingReview', () => {
    it('should delegate to repository insertListingReview', async () => {
      mockRepository.insertListingReview.mockResolvedValueOnce({ id: 'r-new' });

      const res = await service.submitListingReview(
        'list-1',
        5,
        'Great place!',
        'user-1',
      );
      expect(res).toEqual({ id: 'r-new' });
      expect(mockRepository.insertListingReview).toHaveBeenCalledWith(
        'list-1',
        5,
        'Great place!',
        'user-1',
      );
    });
  });

  describe('getUserReviewForListing', () => {
    it('should return user review if found', async () => {
      mockRepository.getUserReviewForListing.mockResolvedValueOnce({
        id: 'rev-user-1',
        rating: 4,
      });

      const res = await service.getUserReviewForListing('list-1', 'user-1');
      expect(res).toEqual({ id: 'rev-user-1', rating: 4 });
      expect(mockRepository.getUserReviewForListing).toHaveBeenCalledWith(
        'list-1',
        'user-1',
      );
    });

    it('should return null if user review is not found', async () => {
      mockRepository.getUserReviewForListing.mockResolvedValueOnce(null);

      const res = await service.getUserReviewForListing('list-1', 'user-1');
      expect(res).toBeNull();
    });
  });

  describe('getPendingReviews', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(service.getPendingReviews(1, 50, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fetch pending reviews if caller is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(
        service.getReviewsByStatus('approved', 1, 50, 'user-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fetch reviews by status if caller is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');
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
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(service.approveReview('r1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call repository updateReviewStatus when caller is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');

      const res = await service.approveReview('r1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateReviewStatus).toHaveBeenCalledWith(
        'r1',
        'approved',
      );
    });
  });

  describe('rejectReview', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(service.rejectReview('r1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call repository updateReviewStatus with rejected when caller is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');

      const res = await service.rejectReview('r1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.updateReviewStatus).toHaveBeenCalledWith(
        'r1',
        'rejected',
      );
    });
  });

  describe('deleteReview', () => {
    it('should throw UnauthorizedException if caller is not admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('user');

      await expect(service.deleteReview('r1', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should call repository deleteReview when caller is admin', async () => {
      mockRepository.getUserRole.mockResolvedValueOnce('admin');

      const res = await service.deleteReview('r1', 'admin-1');
      expect(res).toEqual({ success: true });
      expect(mockRepository.deleteReview).toHaveBeenCalledWith('r1');
    });
  });
});
