import {
  Injectable,
  Inject,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IPropertiesRepository,
  PROPERTIES_REPOSITORY,
  PropertyQueryOptions,
} from './domain';
import { RedisService } from '../common/redis/redis.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  CreatePropertyReviewDto,
} from './dto';
import { ICalSyncResult } from './types/property.types';

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PROPERTIES_REPOSITORY)
    private readonly propertiesRepository: IPropertiesRepository,
    private readonly redisService: RedisService,
  ) {}

  // ============================================
  // Properties CRUD
  // ============================================

  async getPropertiesByIds(ids: string[]): Promise<Record<string, unknown>[]> {
    if (!ids || !ids.length) return [];
    return this.propertiesRepository.getPropertiesByIds(ids);
  }

  async createProperty(
    data: CreatePropertyDto,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.propertiesRepository.insertProperty(data, userId);
    await this.redisService.delByPattern('properties:*');
    return result;
  }

  async getProperties(
    queryOptions: PropertyQueryOptions,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    const cacheKey = `properties:list:${JSON.stringify(queryOptions || {})}`;
    const cached = await this.redisService.getJson<{
      data: Record<string, unknown>[];
      count: number | null;
    }>(cacheKey);
    if (cached) return cached;

    const data = await this.propertiesRepository.getProperties(queryOptions);
    if (data) {
      await this.redisService.setJson(cacheKey, data, 300); // 5 minutes TTL
    }
    return data;
  }

  async getProperty(id: string): Promise<Record<string, unknown>> {
    const cacheKey = `properties:item:${id}`;
    const cached =
      await this.redisService.getJson<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    let prop: Record<string, unknown> | null = null;
    if (isUUID) {
      prop = await this.propertiesRepository.getPropertyByUUID(id);
      if (!prop) throw new NotFoundException('Property not found');
    } else {
      const refId = parseInt(id, 10);
      prop = await this.propertiesRepository.getPropertyByRefId(refId);
      if (!prop) throw new NotFoundException('Property not found');

      if (prop.host_id && typeof prop.host_id === 'string') {
        const hostData = await this.propertiesRepository.getProfile(
          prop.host_id,
        );
        if (hostData) prop.host = hostData;
      }
    }

    if (prop) {
      await this.redisService.setJson(cacheKey, prop, 600); // 10 minutes TTL
    }
    return prop;
  }

  async getAvailableProperties(
    checkIn: string,
    checkOut: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesRepository.getAvailableProperties(checkIn, checkOut);
  }

  async getPropertiesByHost(
    hostId: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesRepository.getPropertiesByHost(hostId);
  }

  async getAdminProperties(
    statusFilter: string = 'all',
    page = 1,
    limit = 50,
  ): Promise<{ data: Record<string, unknown>[]; count: number | null }> {
    return this.propertiesRepository.getAdminProperties(
      statusFilter,
      page,
      limit,
    );
  }

  async updateProperty(
    id: string,
    updates: UpdatePropertyDto,
    userId: string,
  ): Promise<{ success: boolean }> {
    const existingProp = await this.propertiesRepository.getPropertyHostId(id);
    const role = await this.propertiesRepository.getUserRole(userId);

    if (
      !existingProp ||
      (existingProp.host_id !== userId && role !== 'admin')
    ) {
      throw new UnauthorizedException('Not authorized');
    }

    const {
      status: _status,
      ical_token: _icalToken,
      ical_url: _icalUrl,
      last_synced_at: _lastSyncedAt,
      ...safeUpdates
    } = updates;
    await this.propertiesRepository.updateProperty(id, safeUpdates);
    await this.redisService.delByPattern('properties:*');
    return { success: true };
  }

  async updatePropertyStatus(
    id: string,
    status: string,
    reason: string | undefined,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const updates: Record<string, unknown> = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    await this.propertiesRepository.updateProperty(id, updates);
    await this.redisService.delByPattern('properties:*');
    return { success: true };
  }

  async deleteProperty(
    id: string,
    reason: string | undefined,
    userId: string,
  ): Promise<{ success: boolean }> {
    const property = await this.propertiesRepository.getPropertyHostId(id);
    if (!property) throw new NotFoundException('Property not found');

    const role = await this.propertiesRepository.getUserRole(userId);
    if (property.host_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    try {
      await this.propertiesRepository.deletePropertyCascading(id);
    } catch {
      await this.propertiesRepository.updateProperty(id, {
        status: 'rejected',
        title: `${property.title} (Deleted)`,
        location: 'Archived',
      });
    }
    await this.redisService.delByPattern('properties:*');
    return { success: true };
  }

  // ============================================
  // Properties Catalog
  // ============================================

  async getPropertyTypes(): Promise<string[]> {
    return this.propertiesRepository.getPropertyTypes();
  }

  async getPropertyLocations(type: string): Promise<string[]> {
    return this.propertiesRepository.getPropertyLocations(type);
  }

  async getPropertiesByLocation(
    type: string,
    location: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Record<string, unknown>[]; count: number }> {
    return this.propertiesRepository.getPropertiesByLocation(
      type,
      location,
      page,
      limit,
    );
  }

  // ============================================
  // Properties iCal
  // ============================================

  async getICalFeeds(propertyId: string): Promise<Record<string, unknown>[]> {
    return this.propertiesRepository.getICalFeeds(propertyId);
  }

  async addICalFeed(
    propertyId: string,
    name: string,
    url: string,
    userId: string,
  ): Promise<Record<string, unknown>> {
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    return this.propertiesRepository.insertICalFeed(propertyId, name, url);
  }

  async syncPropertyICal(
    propertyId: string,
    userId: string,
  ): Promise<ICalSyncResult[]> {
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    const data = await this.propertiesRepository.getICalFeeds(propertyId);
    if (!data || data.length === 0) return [];

    const results = await Promise.all(
      data.map(async (feed) => {
        const feedId =
          typeof feed.id === 'string'
            ? feed.id
            : typeof feed.id === 'number'
              ? String(feed.id)
              : '';
        try {
          const result = await this.propertiesRepository.syncICalFeed(feedId);
          return { feedId, success: true, count: result };
        } catch (e: unknown) {
          return { feedId, success: false, error: e };
        }
      }),
    );
    return results;
  }

  async removeICalFeed(
    id: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const propertyId =
      await this.propertiesRepository.getICalFeedPropertyId(id);
    if (!propertyId) throw new NotFoundException('iCal feed not found');
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.removeICalFeed(id);
    return { success: true };
  }

  // ============================================
  // Properties Availability
  // ============================================

  async getPropertyAvailability(
    propertyId: string,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, unknown>[]> {
    return this.propertiesRepository.getPropertyAvailability(
      propertyId,
      startDate,
      endDate,
    );
  }

  async updatePropertyAvailability(
    propertyId: string,
    dates: string[],
    status: string,
    price: number | undefined,
    userId: string,
  ): Promise<{ success: boolean }> {
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.deleteAvailability(propertyId, dates);
    if (status === 'available' && !price) return { success: true };

    const entries = dates.map((date) => ({
      property_id: propertyId,
      date,
      status,
      price,
      source: 'manual',
    }));
    await this.propertiesRepository.insertAvailability(entries);
    return { success: true };
  }

  async syncPropertyCalendar(propertyId: string): Promise<unknown> {
    return this.propertiesRepository.syncPropertyCalendar(propertyId);
  }

  async getUnavailableDates(propertyId: string): Promise<string[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.propertiesRepository.getUnavailableDates(propertyId, today);
  }

  // ============================================
  // Properties Reviews
  // ============================================

  async getReviews(
    propertyId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.propertiesRepository.getReviews(
      propertyId,
      from,
      to,
    );
    return { data: result.data, total: result.count };
  }

  async getReviewCount(propertyId: string): Promise<number> {
    return this.propertiesRepository.getReviewCount(propertyId);
  }

  async addReview(
    review: CreatePropertyReviewDto,
    userId: string,
  ): Promise<{ success: boolean }> {
    const propertyId = review.property_id;
    if (!propertyId) {
      throw new BadRequestException('property_id is required');
    }

    const existing = await this.propertiesRepository.getExistingReview(
      propertyId,
      userId,
    );
    if (existing)
      throw new BadRequestException('You have already submitted a review');

    const bookingCount =
      await this.propertiesRepository.getBookingCountForReview(
        propertyId,
        userId,
      );
    if (!bookingCount)
      throw new BadRequestException(
        'You can only review properties you have booked',
      );

    await this.propertiesRepository.insertReview({
      ...review,
      user_id: userId,
    });

    const property =
      await this.propertiesRepository.getPropertyHostId(propertyId);
    if (property) {
      this.propertiesRepository.invokeEmailFunction({
        type: 'new_review',
        userId: property.host_id,
        data: {
          itemTitle: property.title,
          rating: review.rating,
          comment: review.comment,
          guestName: 'A Guest',
          link: `https://alanyaholidays.com/property/${propertyId}`,
        },
      });
    }
    return { success: true };
  }

  async deleteReview(
    reviewId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const review = await this.propertiesRepository.getReviewUserId(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const role = await this.propertiesRepository.getUserRole(userId);
    if (review.user_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.deleteReview(reviewId);
    return { success: true };
  }

  async flagReview(
    reviewId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    await this.propertiesRepository.updateReviewFlag(
      reviewId,
      true,
      true,
      userId,
    );
    return { success: true };
  }

  async unflagReview(
    reviewId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.updateReviewFlag(reviewId, false, false);
    return { success: true };
  }

  async getFlaggedReviews(
    page = 1,
    limit = 20,
    userId: string,
  ): Promise<{ data: Record<string, unknown>[]; total: number | null }> {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.propertiesRepository.getFlaggedReviews(from, to);
    return { data: result.data, total: result.count };
  }

  async bulkDeleteReviews(
    reviewIds: string[],
    userId: string,
  ): Promise<{ success: boolean }> {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.bulkDeleteReviews(reviewIds);
    return { success: true };
  }
}
