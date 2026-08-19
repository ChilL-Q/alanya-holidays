import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from './types/review.types';
import { SubmitReviewDto } from './dto/submit-review.dto';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let mockService: {
    getListingReviews: jest.Mock;
    submitListingReview: jest.Mock;
    getUserReviewForListing: jest.Mock;
    getPendingReviews: jest.Mock;
    getReviewsByStatus: jest.Mock;
    approveReview: jest.Mock;
    rejectReview: jest.Mock;
    deleteReview: jest.Mock;
  };

  const createMockReq = (userId = 'u100'): AuthenticatedRequest =>
    ({
      user: { id: userId, email: 'user@example.com' },
    }) as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    mockService = {
      getListingReviews: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      submitListingReview: jest.fn().mockResolvedValue({ id: 'r1' }),
      getUserReviewForListing: jest.fn().mockResolvedValue(null),
      getPendingReviews: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getReviewsByStatus: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      approveReview: jest.fn().mockResolvedValue({ success: true }),
      rejectReview: jest.fn().mockResolvedValue({ success: true }),
      deleteReview: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  it('should pass pagination params to getListingReviews', async () => {
    await controller.getListingReviews('list-1', '2', '15');
    expect(mockService.getListingReviews).toHaveBeenCalledWith('list-1', 2, 15);
  });

  it('should use default values when pagination params are undefined in getListingReviews', async () => {
    await controller.getListingReviews('list-1', undefined, undefined);
    expect(mockService.getListingReviews).toHaveBeenCalledWith('list-1', 1, 20);
  });

  it('should pass req.user.id and DTO to submitListingReview', async () => {
    const req = createMockReq('u100');
    const dto: SubmitReviewDto = { rating: 5, comment: 'Great!' };

    await controller.submitListingReview('list-1', dto, req);
    expect(mockService.submitListingReview).toHaveBeenCalledWith(
      'list-1',
      5,
      'Great!',
      'u100',
    );
  });

  it('should pass req.user.id to getUserReviewForListing', async () => {
    const req = createMockReq('u100');
    await controller.getUserReviewForListing('list-1', req);
    expect(mockService.getUserReviewForListing).toHaveBeenCalledWith(
      'list-1',
      'u100',
    );
  });

  it('should pass req.user.id and pagination to getPendingReviews', async () => {
    const req = createMockReq('admin-1');
    await controller.getPendingReviews(req, '2', '25');
    expect(mockService.getPendingReviews).toHaveBeenCalledWith(
      2,
      25,
      'admin-1',
    );
  });

  it('should pass req.user.id and query params to getReviewsByStatus', async () => {
    const req = createMockReq('admin-1');
    await controller.getReviewsByStatus('approved', req, '3', '10');
    expect(mockService.getReviewsByStatus).toHaveBeenCalledWith(
      'approved',
      3,
      10,
      'admin-1',
    );
  });

  it('should pass req.user.id to approveReview', async () => {
    const req = createMockReq('admin-1');
    await controller.approveReview('rev-99', req);
    expect(mockService.approveReview).toHaveBeenCalledWith('rev-99', 'admin-1');
  });

  it('should pass req.user.id to rejectReview', async () => {
    const req = createMockReq('admin-1');
    await controller.rejectReview('rev-99', req);
    expect(mockService.rejectReview).toHaveBeenCalledWith('rev-99', 'admin-1');
  });

  it('should pass req.user.id to deleteReview', async () => {
    const req = createMockReq('admin-1');
    await controller.deleteReview('rev-99', req);
    expect(mockService.deleteReview).toHaveBeenCalledWith('rev-99', 'admin-1');
  });
});
