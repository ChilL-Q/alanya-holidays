import { ReviewRating } from '../../../common/domain/value-objects/review-rating.vo';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface UserSummary {
  fullName?: string;
  avatarUrl?: string;
}

export interface ListingSummary {
  id?: string;
  name?: string;
}

export interface CreateReviewProps {
  id?: string;
  listingId: string;
  userId: string;
  rating: ReviewRating | number;
  comment: string;
  status?: ReviewStatus;
  createdAt?: Date;
  updatedAt?: Date;
  user?: UserSummary;
  listing?: ListingSummary;
}

export interface RestoreReviewProps {
  id: string;
  listingId: string;
  userId: string;
  rating: ReviewRating | number;
  comment: string;
  status: ReviewStatus | (string & {});
  createdAt: Date | string;
  updatedAt?: Date | string;
  user?: UserSummary;
  listing?: ListingSummary;
}

/**
 * Rich Domain Entity representing a review for a directory listing.
 * Encapsulates domain invariants, ReviewRating VO, and moderation status transitions.
 */
export class ReviewEntity {
  private readonly _id: string;
  private readonly _listingId: string;
  private readonly _userId: string;
  private _rating: ReviewRating;
  private _comment: string;
  private _status: ReviewStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _user?: UserSummary;
  private readonly _listing?: ListingSummary;

  private constructor(
    id: string,
    listingId: string,
    userId: string,
    rating: ReviewRating,
    comment: string,
    status: ReviewStatus,
    createdAt: Date,
    updatedAt?: Date,
    user?: UserSummary,
    listing?: ListingSummary,
  ) {
    ReviewEntity.validateComment(comment);
    ReviewEntity.validateIdentifiers(listingId, userId);

    this._id = id;
    this._listingId = listingId;
    this._userId = userId;
    this._rating = rating;
    this._comment = comment.trim();
    this._status = status;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt || createdAt;
    this._user = user;
    this._listing = listing;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get listingId(): string {
    return this._listingId;
  }

  get userId(): string {
    return this._userId;
  }

  get rating(): ReviewRating {
    return this._rating;
  }

  get ratingValue(): number {
    return this._rating.value;
  }

  get comment(): string {
    return this._comment;
  }

  get status(): ReviewStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get user(): UserSummary | undefined {
    return this._user;
  }

  get listing(): ListingSummary | undefined {
    return this._listing;
  }

  // Status Invariant Checks
  isApproved(): boolean {
    return this._status === 'approved';
  }

  isPending(): boolean {
    return this._status === 'pending';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  // Moderation State Transitions
  approve(): void {
    this._status = 'approved';
    this._updatedAt = new Date();
  }

  reject(): void {
    this._status = 'rejected';
    this._updatedAt = new Date();
  }

  // Domain Mutation Operations
  updateComment(newComment: string): void {
    ReviewEntity.validateComment(newComment);
    this._comment = newComment.trim();
    this._updatedAt = new Date();
  }

  updateRating(newRating: ReviewRating | number): void {
    this._rating =
      newRating instanceof ReviewRating
        ? newRating
        : ReviewRating.create(newRating);
    this._updatedAt = new Date();
  }

  // Factory methods
  static create(props: CreateReviewProps): ReviewEntity {
    const ratingVo =
      props.rating instanceof ReviewRating
        ? props.rating
        : ReviewRating.create(props.rating);

    const id = props.id || '';
    const status: ReviewStatus = props.status || 'pending';
    const now = new Date();

    return new ReviewEntity(
      id,
      props.listingId,
      props.userId,
      ratingVo,
      props.comment,
      status,
      props.createdAt || now,
      props.updatedAt || now,
      props.user,
      props.listing,
    );
  }

  static restore(props: RestoreReviewProps): ReviewEntity {
    const ratingVo =
      props.rating instanceof ReviewRating
        ? props.rating
        : ReviewRating.create(Number(props.rating));

    let parsedStatus: ReviewStatus;
    if (props.status === 'approved') parsedStatus = 'approved';
    else if (props.status === 'rejected') parsedStatus = 'rejected';
    else parsedStatus = 'pending';

    const createdAt =
      props.createdAt instanceof Date
        ? props.createdAt
        : new Date(props.createdAt);

    const updatedAt = props.updatedAt
      ? props.updatedAt instanceof Date
        ? props.updatedAt
        : new Date(props.updatedAt)
      : createdAt;

    return new ReviewEntity(
      props.id,
      props.listingId,
      props.userId,
      ratingVo,
      props.comment,
      parsedStatus,
      createdAt,
      updatedAt,
      props.user,
      props.listing,
    );
  }

  // Validation rules
  private static validateComment(comment: string): void {
    if (
      !comment ||
      typeof comment !== 'string' ||
      comment.trim().length === 0
    ) {
      throw new Error('Review comment cannot be empty');
    }
    if (comment.trim().length > 5000) {
      throw new Error('Review comment cannot exceed 5000 characters');
    }
  }

  private static validateIdentifiers(listingId: string, userId: string): void {
    if (!listingId || typeof listingId !== 'string' || !listingId.trim()) {
      throw new Error('Listing ID is required');
    }
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      throw new Error('User ID is required');
    }
  }
}
