import { PropertyEntity } from '../entities/property.entity';
import { PropertyFilterDto } from '../../dto/property-filter.dto';

export const PROPERTIES_REPOSITORY = Symbol('IPropertiesRepository');

export interface PropertyQueryOptions {
  page?: number;
  limit?: number;
  filters?: PropertyFilterDto;
  location?: string;
  allowedIds?: string;
  sort?: string;
}

export interface ReviewItem {
  id?: string;
  property_id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  is_flagged?: boolean;
  is_hidden?: boolean;
  created_at?: string | Date;
  [key: string]: unknown;
}

/**
 * Domain Repository Interface for Properties.
 * Zero external framework dependencies.
 */
export interface IPropertiesRepository {
  // Domain Entity operations
  findById(id: string): Promise<PropertyEntity | null>;
  save(property: PropertyEntity): Promise<PropertyEntity>;

  // Properties Queries & Persistence
  getPropertiesByIds(ids: string[]): Promise<Record<string, unknown>[]>;
  insertProperty(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<Record<string, unknown>>;
  getProperties(
    queryOptions: PropertyQueryOptions,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }>;
  getPropertyByUUID(id: string): Promise<Record<string, unknown> | null>;
  getPropertyByRefId(refId: number): Promise<Record<string, unknown> | null>;
  getAvailableProperties(
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, unknown>[]>;
  getPropertiesByHost(hostId: string): Promise<Record<string, unknown>[]>;
  getAdminProperties(
    statusFilter?: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }>;
  getPropertyHostId(
    id: string,
  ): Promise<{ host_id: string; title: string } | null>;
  updateProperty(id: string, updates: Record<string, unknown>): Promise<void>;
  deletePropertyCascading(id: string): Promise<void>;

  // Catalog
  getPropertyTypes(): Promise<string[]>;
  getPropertyLocations(type: string): Promise<string[]>;
  getPropertiesByLocation(
    type: string,
    location: string,
    page?: number,
    limit?: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number }>;

  // iCal
  getICalFeeds(propertyId: string): Promise<Record<string, unknown>[]>;
  insertICalFeed(
    propertyId: string,
    name: string,
    url: string,
  ): Promise<Record<string, unknown>>;
  syncICalFeed(feedId: string): Promise<unknown>;
  getICalFeedPropertyId(id: string): Promise<string | undefined>;
  removeICalFeed(id: string): Promise<void>;

  // Availability
  getPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, unknown>[]>;
  deleteAvailability(propertyId: string, dates: string[]): Promise<void>;
  insertAvailability(entries: Record<string, unknown>[]): Promise<void>;
  syncPropertyCalendar(propertyId: string): Promise<unknown>;
  getUnavailableDates(propertyId: string, today: string): Promise<string[]>;

  // Reviews
  getReviews(
    propertyId: string,
    from: number,
    to: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }>;
  getReviewCount(propertyId: string): Promise<number>;
  getExistingReview(
    propertyId: string,
    userId: string,
  ): Promise<{ id: string } | null>;
  getBookingCountForReview(
    propertyId: string,
    userId: string,
  ): Promise<number | null>;
  insertReview(review: Record<string, unknown>): Promise<void>;
  getReviewUserId(reviewId: string): Promise<{ user_id: string } | null>;
  deleteReview(reviewId: string): Promise<void>;
  updateReviewFlag(
    reviewId: string,
    isFlagged: boolean,
    isHidden: boolean,
    excludeUserId?: string,
  ): Promise<void>;
  getFlaggedReviews(
    from: number,
    to: number,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }>;
  bulkDeleteReviews(reviewIds: string[]): Promise<void>;

  // Profiles & Auth queries
  getProfile(userId: string): Promise<Record<string, unknown> | null>;
}
