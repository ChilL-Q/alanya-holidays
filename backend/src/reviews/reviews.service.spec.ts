import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsRepository } from './reviews.repository';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getListingReviews: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      insertListingReview: jest.fn().mockResolvedValue({ id: 'r-1' }),
      getUserReviewForListing: jest.fn(),
      getUserRole: jest.fn(),
      getReviewsByStatus: jest.fn().mockResolvedValue({ data: [], count: 0 }),
      updateReviewStatus: jest.fn().mockResolvedValue({}),
      deleteReview: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: ReviewsRepository,
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
      expect(mockRepository.getListingReviews).toHaveBeenCalledWith('list-1', 10, 19);
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
      expect(mockRepository.updateReviewStatus).toHaveBeenCalledWith('r1', 'approved');
    });
  });
});
