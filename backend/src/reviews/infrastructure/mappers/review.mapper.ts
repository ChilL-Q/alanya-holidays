import {
  ReviewEntity,
  ReviewStatus,
  UserSummary,
  ListingSummary,
} from '../../domain/entities/review.entity';

export interface ReviewPersistenceRow {
  id?: string;
  listing_id?: string;
  listingId?: string;
  user_id?: string;
  userId?: string;
  rating?: number | string;
  comment?: string;
  status?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  user?: {
    full_name?: string | null;
    avatar_url?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  listing?: {
    id?: string | null;
    name?: string | null;
  } | null;
  [key: string]: unknown;
}

function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return fallback;
}

export class ReviewMapper {
  /**
   * Converts a database record into a rich ReviewEntity domain model.
   */
  static toDomain(
    row: ReviewPersistenceRow | Record<string, unknown> | null | undefined,
  ): ReviewEntity {
    if (!row || typeof row !== 'object') {
      throw new Error(
        'Cannot map invalid or empty database row to ReviewEntity',
      );
    }

    const id = safeString(row.id);
    const listingId = safeString(row.listing_id) || safeString(row.listingId);
    const userId = safeString(row.user_id) || safeString(row.userId);

    const rawRating = row.rating;
    const ratingValue =
      rawRating !== undefined && rawRating !== null && !isNaN(Number(rawRating))
        ? Number(rawRating)
        : 5;

    const comment = safeString(row.comment);
    const rawStatus = safeString(row.status) || 'pending';
    const status: ReviewStatus =
      rawStatus === 'approved' ||
      rawStatus === 'rejected' ||
      rawStatus === 'pending'
        ? rawStatus
        : 'pending';

    const createdAt = row.created_at
      ? new Date(row.created_at as string | Date)
      : row.createdAt
        ? new Date(row.createdAt as string | Date)
        : new Date();

    const updatedAt = row.updated_at
      ? new Date(row.updated_at as string | Date)
      : row.updatedAt
        ? new Date(row.updatedAt as string | Date)
        : createdAt;

    let user: UserSummary | undefined;
    if (row.user && typeof row.user === 'object') {
      const userObj = row.user as Record<string, unknown>;
      user = {
        fullName:
          typeof userObj.full_name === 'string'
            ? userObj.full_name
            : typeof userObj.fullName === 'string'
              ? userObj.fullName
              : undefined,
        avatarUrl:
          typeof userObj.avatar_url === 'string'
            ? userObj.avatar_url
            : typeof userObj.avatarUrl === 'string'
              ? userObj.avatarUrl
              : undefined,
      };
    }

    let listing: ListingSummary | undefined;
    if (row.listing && typeof row.listing === 'object') {
      const listingObj = row.listing as Record<string, unknown>;
      listing = {
        id: typeof listingObj.id === 'string' ? listingObj.id : undefined,
        name: typeof listingObj.name === 'string' ? listingObj.name : undefined,
      };
    }

    return ReviewEntity.restore({
      id,
      listingId,
      userId,
      rating: ratingValue,
      comment,
      status,
      createdAt,
      updatedAt,
      user,
      listing,
    });
  }

  /**
   * Converts a ReviewEntity domain model into a database persistence format.
   */
  static toPersistence(entity: ReviewEntity): Record<string, unknown> {
    if (!entity || !(entity instanceof ReviewEntity)) {
      throw new Error('Cannot map non-ReviewEntity to persistence format');
    }

    const record: Record<string, unknown> = {
      listing_id: entity.listingId,
      user_id: entity.userId,
      rating: entity.ratingValue,
      comment: entity.comment,
      status: entity.status,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };

    if (entity.id) {
      record.id = entity.id;
    }

    return record;
  }
}
