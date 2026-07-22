import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AuthGuard } from '../auth/auth.guard';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let mockService: any;

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

  it('should pass req.user.id to submitListingReview', async () => {
    const req = { user: { id: 'u100' } };
    await controller.submitListingReview('list-1', { rating: 5, comment: 'Great!' }, req);
    expect(mockService.submitListingReview).toHaveBeenCalledWith('list-1', 5, 'Great!', 'u100');
  });

  it('should pass req.user.id to approveReview', async () => {
    const req = { user: { id: 'admin-1' } };
    await controller.approveReview('rev-99', req);
    expect(mockService.approveReview).toHaveBeenCalledWith('rev-99', 'admin-1');
  });
});
