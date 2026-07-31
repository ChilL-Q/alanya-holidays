import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmedBookingDetails } from './dto/booking-notification.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly notificationsService?: NotificationsService,
  ) {}

  async checkConflict(
    itemId: string,
    itemType: string,
    checkIn: string,
    checkOut: string,
  ) {
    const overlappingBookings =
      await this.bookingsRepository.findOverlappingBookings(
        itemId,
        itemType,
        checkIn,
        checkOut,
      );

    if (overlappingBookings.length > 0)
      return { has_conflict: true, message: 'Dates are already booked' };

    if (itemType === 'property') {
      const blocks =
        await this.bookingsRepository.checkPropertyAvailabilityBlocks(
          itemId,
          checkIn,
          checkOut,
        );

      if (blocks.length > 0)
        return { has_conflict: true, message: 'Dates are unavailable' };
    }

    return { has_conflict: false, message: 'Available' };
  }

  async createBooking(dto: CreateBookingDto) {
    const itemType = dto.item_type || 'property';
    let hostId: string | null = null;
    let propertyTitle = 'Item';

    // Pre-fetch item title/host and perform early validation
    if (itemType === 'property') {
      const property = await this.bookingsRepository.getProperty(dto.item_id);
      if (!property) throw new BadRequestException('Property not found');
      if (property.status !== 'approved')
        throw new BadRequestException('Property is not available');
      if (property.host_id === dto.user_id)
        throw new BadRequestException('Cannot book your own property');
      hostId = property.host_id;
      propertyTitle = property.title;
    } else if (itemType === 'service') {
      const service = await this.bookingsRepository.getService(dto.item_id);
      if (!service) throw new BadRequestException('Service not found');
      if (service.status !== 'approved')
        throw new BadRequestException('Service is not available');
      if (service.provider_id === dto.user_id)
        throw new BadRequestException('Cannot book your own service');
      hostId = service.provider_id;
      propertyTitle = service.title;
    }

    // Execute atomic RPC (performs validations, advisory locking, overlap check & date series blocking in 1 DB RTT)
    let bookingId: string;
    try {
      bookingId = await this.bookingsRepository.createBookingRpc({
        itemId: dto.item_id,
        userId: dto.user_id,
        checkIn: dto.check_in,
        checkOut: dto.check_out,
        totalPrice: dto.total_price,
        guests: dto.guests,
        message: dto.message,
        paymentMethod: dto.payment_method,
        itemType,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to create booking');
    }

    const booking = {
      id: bookingId,
      check_in: dto.check_in,
      check_out: dto.check_out,
      total_price: dto.total_price,
      guests: dto.guests,
      message: dto.message,
    };

    this.sendEmails(booking, dto.user_id, hostId, propertyTitle, itemType);

    if (hostId && this.notificationsService) {
      this.notificationsService.notifyUser(hostId, {
        type: 'NEW_BOOKING',
        title: 'Новое бронирование!',
        message: `Новая заявка на "${propertyTitle}" с ${dto.check_in} по ${dto.check_out}`,
        data: {
          bookingId,
          itemId: dto.item_id,
          totalPrice: dto.total_price,
          checkIn: dto.check_in,
          checkOut: dto.check_out,
        },
      });
    }

    return bookingId;
  }

  private async sendEmails(
    booking: any,
    userId: string,
    hostId: string | null,
    title: string,
    type: string,
  ) {
    try {
      const profile = await this.bookingsRepository.getProfile(userId);
      const guestName = profile?.full_name || 'Guest';

      await this.invokeEmailWithRetry({
        type: 'booking_created',
        userId: userId,
        data: {
          userName: guestName,
          itemTitle: title,
          itemTypeLabel: type === 'service' ? 'Service' : 'Property',
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          totalPrice: booking.total_price,
          guests: booking.guests,
          link: `${process.env.APP_URL || 'http://localhost:8080'}/profile`,
        },
      });

      if (hostId) {
        await this.invokeEmailWithRetry({
          type: 'booking_request_host',
          userId: hostId,
          data: {
            guestName,
            itemTitle: title,
            itemTypeLabel: type === 'service' ? 'Service' : 'Property',
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            totalPrice: booking.total_price,
            guests: booking.guests,
            message: booking.message,
            link: `${process.env.APP_URL || 'http://localhost:8080'}/host/bookings`,
          },
        });
      }
    } catch (e) {
      console.error('Failed to send emails', e);
    }
  }

  private async invokeEmailWithRetry(payload: any, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.bookingsRepository.invokeEmailFunction(payload);
        return;
      } catch (err) {
        if (attempt === maxRetries) {
          console.error(
            `Email delivery failed after ${maxRetries} attempts:`,
            err,
          );
        } else {
          const delay = Math.pow(2, attempt) * 100 + Math.random() * 50;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }
  }

  // ============================================
  // Booking Queries (Moved from frontend)
  // ============================================

  async getUserBookings(userId: string) {
    const bookings = await this.bookingsRepository.getUserBookings(userId);
    return bookings || [];
  }

  async getAdminBookings(
    statusFilter: string | undefined,
    requestUserId: string,
  ) {
    const role = await this.bookingsRepository.getUserRole(requestUserId);
    if (role !== 'admin')
      throw new UnauthorizedException('Admin access required');

    const bookings =
      await this.bookingsRepository.getAdminBookings(statusFilter);
    return bookings || [];
  }

  async getBookingsForHost(
    hostId: string,
    dateFrom?: string,
    dateTo?: string,
    requestUserId?: string,
  ) {
    const role = await this.bookingsRepository.getUserRole(requestUserId!);
    if (requestUserId !== hostId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    const properties =
      await this.bookingsRepository.getPropertiesByHost(hostId);
    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p: any) => p.id);
    const propertyMap = new Map(properties.map((p: any) => [p.id, p]));

    const bookings = await this.bookingsRepository.getBookingsByPropertyIds(
      propertyIds,
      dateFrom,
      dateTo,
    );
    if (!bookings || bookings.length === 0) return [];

    const guestIds = Array.from(
      new Set(bookings.map((b: any) => b.user_id).filter(Boolean)),
    );
    const profiles = await this.bookingsRepository.getProfilesByIds(guestIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return bookings.map((booking: any) => ({
      ...booking,
      user: profileMap.get(booking.user_id),
      property: propertyMap.get(booking.item_id),
      itemTitle: propertyMap.get(booking.item_id)?.title,
    }));
  }

  private async enrichBookings(bookings: any[], includeUser = false) {
    const propertyIds = Array.from(
      new Set(
        bookings
          .filter((b) => b.item_type === 'property')
          .map((b) => b.item_id)
          .filter(Boolean),
      ),
    );
    const serviceIds = Array.from(
      new Set(
        bookings
          .filter((b) => b.item_type === 'service')
          .map((b) => b.item_id)
          .filter(Boolean),
      ),
    );

    let usersMap = new Map();
    if (includeUser) {
      const userIds = Array.from(
        new Set(bookings.map((b) => b.user_id).filter(Boolean)),
      );
      if (userIds.length > 0) {
        const users = await this.bookingsRepository.getProfilesByIds(userIds);
        usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      }
    }

    const [propertiesData, servicesData] = await Promise.all([
      propertyIds.length > 0
        ? this.bookingsRepository.getPropertiesByIds(propertyIds)
        : Promise.resolve([]),
      serviceIds.length > 0
        ? this.bookingsRepository.getServicesByIds(serviceIds)
        : Promise.resolve([]),
    ]);

    const propertyMap = new Map(
      (propertiesData || []).map((p: any) => [p.id, p]),
    );
    const serviceMap = new Map((servicesData || []).map((s: any) => [s.id, s]));

    return bookings.map((booking) => {
      let itemDetails: any = {};
      if (booking.item_type === 'property') {
        const property = propertyMap.get(booking.item_id);
        itemDetails = { property, itemTitle: property?.title };
      } else if (booking.item_type === 'service') {
        const service = serviceMap.get(booking.item_id);
        itemDetails = { service, itemTitle: service?.title };
      }
      return {
        ...booking,
        ...itemDetails,
        ...(includeUser ? { user: usersMap.get(booking.user_id) } : {}),
      };
    });
  }

  // ============================================
  // Booking Mutations (Moved from frontend)
  // ============================================

  async updateBookingStatus(
    id: string,
    status: string,
    reason: string | undefined,
    userId: string,
  ) {
    const currentBooking = await this.bookingsRepository.getBookingById(id);

    if (!currentBooking) throw new NotFoundException('Booking not found');

    const isBookingOwner = currentBooking.user_id === userId;
    const propertyObj = Array.isArray(currentBooking.property)
      ? currentBooking.property[0]
      : currentBooking.property;
    const serviceObj = Array.isArray(currentBooking.service)
      ? currentBooking.service[0]
      : currentBooking.service;
    const isPropertyHost = propertyObj?.host_id === userId;
    const isServiceProvider = serviceObj?.provider_id === userId;

    const role = await this.bookingsRepository.getUserRole(userId);
    if (
      !isBookingOwner &&
      !isPropertyHost &&
      !isServiceProvider &&
      role !== 'admin'
    ) {
      throw new UnauthorizedException('Not authorized');
    }

    if (status === 'cancelled') {
      await this.bookingsRepository.unblockDatesForBooking(id);
    }

    await this.bookingsRepository.updateBookingStatus(id, status);

    // Logging & Emails
    const typeLabel = propertyObj
      ? 'Property'
      : serviceObj
        ? 'Service'
        : 'Item';
    const itemTitle = propertyObj?.title || serviceObj?.title || 'Item';
    const hostId = propertyObj?.host_id || serviceObj?.provider_id;

    let emailType: string | null = null;
    if (status === 'confirmed') emailType = 'booking_confirmed';
    else if (status === 'cancelled')
      emailType =
        currentBooking.status === 'pending'
          ? 'booking_rejected'
          : 'booking_cancelled';

    if (emailType) {
      this.bookingsRepository.invokeEmailFunction({
        type: emailType,
        userId: currentBooking.user_id,
        data: {
          itemTitle,
          itemTypeLabel: typeLabel,
          checkIn: currentBooking.check_in,
          checkOut: currentBooking.check_out,
          reason,
          link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/profile`,
        },
      });

      if (status === 'cancelled' && hostId) {
        this.bookingsRepository.invokeEmailFunction({
          type: 'booking_cancelled_host',
          userId: hostId,
          data: {
            guestName: 'Guest',
            itemTitle,
            itemTypeLabel: typeLabel,
            checkIn: currentBooking.check_in,
            checkOut: currentBooking.check_out,
            link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/host/bookings`,
          },
        });
      }
    }
    return { success: true };
  }

  async cancelBooking(id: string, userId: string) {
    const booking = await this.bookingsRepository.getBookingForCancellation(id);
    if (!booking) throw new NotFoundException('Booking not found');

    // Authorization is handled inside updateBookingStatus, but we ensure it's either user or admin
    return this.updateBookingStatus(
      id,
      'cancelled',
      'User initiated cancellation',
      userId,
    );
  }

  async updatePayoutStatus(id: string, payoutStatus: string, userId: string) {
    const role = await this.bookingsRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException('Admin access required');

    await this.bookingsRepository.updatePayoutStatus(id, payoutStatus);
    return { success: true };
  }

  async confirmBookingPayment(
    bookingIds: string[],
    userId: string,
    sessionId: string,
    paymentIntentId?: string | null,
  ) {
    const updatedRows = await this.bookingsRepository.confirmBookingsFromStripe(
      bookingIds,
      userId,
      sessionId,
      paymentIntentId,
    );

    if (updatedRows.length === 0) {
      return { confirmedCount: 0 };
    }

    const confirmedIds = updatedRows.map((r: { id: string }) => r.id);
    const bookings =
      await this.bookingsRepository.getConfirmedBookingsDetails(confirmedIds);

    for (const booking of bookings as ConfirmedBookingDetails[]) {
      const itemTitle =
        booking.property?.title ?? booking.service?.title ?? 'Booking';
      const guestEmail = booking.profile?.email;
      if (guestEmail) {
        this.bookingsRepository.invokeEmailFunction({
          to: guestEmail,
          type: 'booking_confirmed',
          data: {
            itemTitle,
            checkIn: booking.check_in,
            checkOut: booking.check_out,
            guests: String(booking.guests ?? 1),
            link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/profile`,
          },
        });
      }
    }

    return { confirmedCount: confirmedIds.length };
  }
}
