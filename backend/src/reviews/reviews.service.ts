import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import {
  IReviewsRepository,
  REVIEWS_REPOSITORY,
} from './domain/repositories/reviews.repository.interface';
import {
  PaginatedReviewsResponse,
  ReviewOperationResult,
} from './types/review.types';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEWS_REPOSITORY)
    private readonly reviewsRepository: IReviewsRepository,
  ) {}

  async getListingReviews(
    listingId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedReviewsResponse> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.reviewsRepository.getListingReviews(
      listingId,
      from,
      to,
    );
    return { data: result.data, total: result.count };
  }

  async submitListingReview(
    listingId: string,
    rating: number,
    comment: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    return this.reviewsRepository.insertListingReview(
      listingId,
      rating,
      comment,
      userId,
    );
  }

  async getUserReviewForListing(
    listingId: string,
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    const data = await this.reviewsRepository.getUserReviewForListing(
      listingId,
      userId,
    );
    return data || null;
  }

  private async checkAdmin(userId: string): Promise<void> {
    const role = await this.reviewsRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Admin only');
  }

  async getPendingReviews(
    page = 1,
    limit = 50,
    requestUserId: string,
  ): Promise<PaginatedReviewsResponse> {
    await this.checkAdmin(requestUserId);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.reviewsRepository.getReviewsByStatus(
      'pending',
      from,
      to,
      true,
    );
    return { data: result.data, total: result.count };
  }

  async getReviewsByStatus(
    status: string,
    page = 1,
    limit = 50,
    requestUserId: string,
  ): Promise<PaginatedReviewsResponse> {
    await this.checkAdmin(requestUserId);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.reviewsRepository.getReviewsByStatus(
      status,
      from,
      to,
      false,
    );
    return { data: result.data, total: result.count };
  }

  async approveReview(
    id: string,
    requestUserId: string,
  ): Promise<ReviewOperationResult> {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.updateReviewStatus(id, 'approved');
    return { success: true };
  }

  async rejectReview(
    id: string,
    requestUserId: string,
  ): Promise<ReviewOperationResult> {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.updateReviewStatus(id, 'rejected');
    return { success: true };
  }

  async deleteReview(
    id: string,
    requestUserId: string,
  ): Promise<ReviewOperationResult> {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.deleteReview(id);
    return { success: true };
  }
}
