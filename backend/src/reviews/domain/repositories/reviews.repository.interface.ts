import { ReviewEntity } from '../entities/review.entity';

export const REVIEWS_REPOSITORY = Symbol('IReviewsRepository');

export interface ReviewListResult {
  data: Record<string, unknown>[];
  count: number;
}

/**
 * Domain Repository Interface for Reviews.
 * Pure interface with zero external framework dependencies.
 */
export interface IReviewsRepository {
  findById(id: string): Promise<ReviewEntity | null>;
  save(review: ReviewEntity): Promise<ReviewEntity>;
  getListingReviews(
    listingId: string,
    from: number,
    to: number,
  ): Promise<ReviewListResult>;
  insertListingReview(
    listingId: string,
    rating: number,
    comment: string,
    userId: string,
  ): Promise<Record<string, unknown>>;
  getUserReviewForListing(
    listingId: string,
    userId: string,
  ): Promise<Record<string, unknown> | null>;
  getReviewsByStatus(
    status: string,
    from: number,
    to: number,
    ascending: boolean,
  ): Promise<ReviewListResult>;
  updateReviewStatus(id: string, status: string): Promise<void>;
  deleteReview(id: string): Promise<void>;
}
