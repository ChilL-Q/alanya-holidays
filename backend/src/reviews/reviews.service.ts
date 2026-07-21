import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly reviewsRepository: ReviewsRepository) {}

  async getListingReviews(listingId: string, page = 1, limit = 20) {
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
  ) {
    return this.reviewsRepository.insertListingReview(
      listingId,
      rating,
      comment,
      userId,
    );
  }

  async getUserReviewForListing(listingId: string, userId: string) {
    const data = await this.reviewsRepository.getUserReviewForListing(
      listingId,
      userId,
    );
    return data || null;
  }

  private async checkAdmin(userId: string) {
    const role = await this.reviewsRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Admin only');
  }

  async getPendingReviews(page = 1, limit = 50, requestUserId: string) {
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
  ) {
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

  async approveReview(id: string, requestUserId: string) {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.updateReviewStatus(id, 'approved');
    return { success: true };
  }

  async rejectReview(id: string, requestUserId: string) {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.updateReviewStatus(id, 'rejected');
    return { success: true };
  }

  async deleteReview(id: string, requestUserId: string) {
    await this.checkAdmin(requestUserId);
    await this.reviewsRepository.deleteReview(id);
    return { success: true };
  }
}
