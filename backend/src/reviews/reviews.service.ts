import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import {
  IReviewsRepository,
  REVIEWS_REPOSITORY,
} from './domain/repositories/reviews.repository.interface';
import {
  PaginatedReviewsResponse,
  ReviewOperationResult,
} from './types/review.types';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (!UUID_RE.test(listingId)) {
      return { data: [], total: 0 };
    }
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
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return {};
    }
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
    if (!UUID_RE.test(listingId) || !UUID_RE.test(userId)) {
      return null;
    }
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
    if (!UUID_RE.test(id)) return { success: false };
    await this.reviewsRepository.updateReviewStatus(id, 'approved');
    return { success: true };
  }

  async rejectReview(
    id: string,
    requestUserId: string,
  ): Promise<ReviewOperationResult> {
    await this.checkAdmin(requestUserId);
    if (!UUID_RE.test(id)) return { success: false };
    await this.reviewsRepository.updateReviewStatus(id, 'rejected');
    return { success: true };
  }

  async deleteReview(
    id: string,
    requestUserId: string,
  ): Promise<ReviewOperationResult> {
    await this.checkAdmin(requestUserId);
    if (!UUID_RE.test(id)) return { success: false };
    await this.reviewsRepository.deleteReview(id);
    return { success: true };
  }
}
