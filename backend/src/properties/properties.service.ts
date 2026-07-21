import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PropertiesRepository } from './properties.repository';

@Injectable()
export class PropertiesService {
  constructor(private readonly propertiesRepository: PropertiesRepository) {}

  // ============================================
  // Properties CRUD
  // ============================================

  async getPropertiesByIds(ids: string[]) {
    if (!ids || !ids.length) return [];
    return this.propertiesRepository.getPropertiesByIds(ids);
  }

  async createProperty(data: any, userId: string) {
    return this.propertiesRepository.insertProperty(data, userId);
  }

  async getProperties(queryOptions: any) {
    return this.propertiesRepository.getProperties(queryOptions);
  }

  async getProperty(id: string) {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    if (isUUID) {
      const data = await this.propertiesRepository.getPropertyByUUID(id);
      if (!data) throw new NotFoundException('Property not found');
      return data;
    } else {
      const refId = parseInt(id);
      const prop = await this.propertiesRepository.getPropertyByRefId(refId);
      if (!prop) throw new NotFoundException('Property not found');

      if (prop.host_id) {
        const hostData = await this.propertiesRepository.getProfile(
          prop.host_id,
        );
        if (hostData) prop.host = hostData;
      }
      return prop;
    }
  }

  async getAvailableProperties(checkIn: string, checkOut: string) {
    return this.propertiesRepository.getAvailableProperties(checkIn, checkOut);
  }

  async getPropertiesByHost(hostId: string) {
    return this.propertiesRepository.getPropertiesByHost(hostId);
  }

  async getAdminProperties(statusFilter: string = 'all', page = 1, limit = 50) {
    return this.propertiesRepository.getAdminProperties(
      statusFilter,
      page,
      limit,
    );
  }

  async updateProperty(id: string, updates: any, userId: string) {
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
    return { success: true };
  }

  async updatePropertyStatus(
    id: string,
    status: string,
    reason: string | undefined,
    userId: string,
  ) {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const updates: any = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    await this.propertiesRepository.updateProperty(id, updates);
    return { success: true };
  }

  async deleteProperty(id: string, reason: string | undefined, userId: string) {
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
    return { success: true };
  }

  // ============================================
  // Properties Catalog
  // ============================================

  async getPropertyTypes() {
    return this.propertiesRepository.getPropertyTypes();
  }

  async getPropertyLocations(type: string) {
    return this.propertiesRepository.getPropertyLocations(type);
  }

  async getPropertiesByLocation(
    type: string,
    location: string,
    page = 1,
    limit = 20,
  ) {
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

  async getICalFeeds(propertyId: string) {
    return this.propertiesRepository.getICalFeeds(propertyId);
  }

  async addICalFeed(
    propertyId: string,
    name: string,
    url: string,
    userId: string,
  ) {
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    return this.propertiesRepository.insertICalFeed(propertyId, name, url);
  }

  async syncPropertyICal(propertyId: string, userId: string) {
    const prop = await this.propertiesRepository.getPropertyHostId(propertyId);
    const role = await this.propertiesRepository.getUserRole(userId);
    if (!prop || (prop.host_id !== userId && role !== 'admin'))
      throw new UnauthorizedException('Not authorized');

    const data = await this.propertiesRepository.getICalFeeds(propertyId);
    if (!data || data.length === 0) return [];

    const results = await Promise.all(
      data.map(async (feed: any) => {
        try {
          const result = await this.propertiesRepository.syncICalFeed(feed.id);
          return { feedId: feed.id, success: true, count: result };
        } catch (e) {
          return { feedId: feed.id, success: false, error: e };
        }
      }),
    );
    return results;
  }

  async removeICalFeed(id: string, userId: string) {
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
  ) {
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
  ) {
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

  async syncPropertyCalendar(propertyId: string) {
    return this.propertiesRepository.syncPropertyCalendar(propertyId);
  }

  async getUnavailableDates(propertyId: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.propertiesRepository.getUnavailableDates(propertyId, today);
  }

  // ============================================
  // Properties Reviews
  // ============================================

  async getReviews(propertyId: string, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.propertiesRepository.getReviews(
      propertyId,
      from,
      to,
    );
    return { data: result.data, total: result.count };
  }

  async getReviewCount(propertyId: string) {
    return this.propertiesRepository.getReviewCount(propertyId);
  }

  async addReview(review: any, userId: string) {
    const existing = await this.propertiesRepository.getExistingReview(
      review.property_id,
      userId,
    );
    if (existing)
      throw new BadRequestException('You have already submitted a review');

    const bookingCount =
      await this.propertiesRepository.getBookingCountForReview(
        review.property_id,
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

    const property = await this.propertiesRepository.getPropertyHostId(
      review.property_id,
    );
    if (property) {
      this.propertiesRepository.invokeEmailFunction({
        type: 'new_review',
        userId: property.host_id,
        data: {
          itemTitle: property.title,
          rating: review.rating,
          comment: review.comment,
          guestName: 'A Guest',
          link: `https://alanyaholidays.com/property/${review.property_id}`,
        },
      });
    }
    return { success: true };
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.propertiesRepository.getReviewUserId(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const role = await this.propertiesRepository.getUserRole(userId);
    if (review.user_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.deleteReview(reviewId);
    return { success: true };
  }

  async flagReview(reviewId: string, userId: string) {
    await this.propertiesRepository.updateReviewFlag(
      reviewId,
      true,
      true,
      userId,
    );
    return { success: true };
  }

  async unflagReview(reviewId: string, userId: string) {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.updateReviewFlag(reviewId, false, false);
    return { success: true };
  }

  async getFlaggedReviews(page = 1, limit = 20, userId: string) {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const result = await this.propertiesRepository.getFlaggedReviews(from, to);
    return { data: result.data, total: result.count };
  }

  async bulkDeleteReviews(reviewIds: string[], userId: string) {
    const role = await this.propertiesRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');

    await this.propertiesRepository.bulkDeleteReviews(reviewIds);
    return { success: true };
  }
}
