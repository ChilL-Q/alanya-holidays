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
import { BookingEntity, BookingItemType, Money, StayPeriod } from './domain';
import { BookingMapper } from './infrastructure/booking.mapper';
import {
  PropertySummaryRow,
  ServiceSummaryRow,
} from './dto/booking-repository.dto';

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
    let stayPeriod: StayPeriod;
    try {
      stayPeriod = new StayPeriod(checkIn, checkOut);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid stay period';
      throw new BadRequestException(msg);
    }

    const overlappingBookings =
      await this.bookingsRepository.findOverlappingBookings(
        itemId,
        itemType,
        stayPeriod,
      );

    if (overlappingBookings.length > 0)
      return { has_conflict: true, message: 'Dates are already booked' };

    if (itemType === 'property') {
      const blocks =
        await this.bookingsRepository.checkPropertyAvailabilityBlocks(
          itemId,
          stayPeriod.checkIn,
          stayPeriod.checkOut,
        );

      if (blocks.length > 0)
        return { has_conflict: true, message: 'Dates are unavailable' };
    }

    return { has_conflict: false, message: 'Available' };
  }

  async createBooking(dto: CreateBookingDto) {
    const itemType = (dto.item_type || 'property') as BookingItemType;

    // Validate domain invariants through Value Objects and BookingEntity factory
    let stayPeriod: StayPeriod;
    let totalPrice: Money;
    let bookingEntity: BookingEntity;

    try {
      stayPeriod = new StayPeriod(dto.check_in, dto.check_out);
      totalPrice = new Money(dto.total_price, 'EUR');
      bookingEntity = BookingEntity.create({
        itemId: dto.item_id,
        itemType,
        guestId: dto.user_id,
        stayPeriod,
        totalPrice,
        guestsCount: dto.guests,
        message: dto.message,
        paymentMethod: dto.payment_method,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid booking details';
      throw new BadRequestException(msg);
    }

    let hostId: string | null = null;
    let propertyTitle = 'Item';

    // Pre-fetch item title/host and perform early validation
    if (bookingEntity.itemType === 'property') {
      const property = await this.bookingsRepository.getProperty(
        bookingEntity.itemId,
      );
      if (!property) throw new BadRequestException('Property not found');
      if (property.status !== 'approved')
        throw new BadRequestException('Property is not available');
      if (property.host_id === bookingEntity.guestId)
        throw new BadRequestException('Cannot book your own property');
      hostId = property.host_id;
      propertyTitle = property.title;
    } else if (bookingEntity.itemType === 'service') {
      const service = await this.bookingsRepository.getService(
        bookingEntity.itemId,
      );
      if (!service) throw new BadRequestException('Service not found');
      if (service.status !== 'approved')
        throw new BadRequestException('Service is not available');
      if (service.provider_id === bookingEntity.guestId)
        throw new BadRequestException('Cannot book your own service');
      hostId = service.provider_id;
      propertyTitle = service.title;
    }

    // Execute atomic RPC (validations, advisory locking, overlap check & date series blocking in 1 DB RTT)
    let bookingId: string;
    try {
      bookingId = await this.bookingsRepository.createBookingRpc({
        itemId: bookingEntity.itemId,
        userId: bookingEntity.guestId,
        checkIn: bookingEntity.stayPeriod.checkIn,
        checkOut: bookingEntity.stayPeriod.checkOut,
        totalPrice: bookingEntity.totalPrice.amount,
        guests: bookingEntity.guestsCount,
        message: bookingEntity.message,
        paymentMethod: bookingEntity.paymentMethod,
        itemType: bookingEntity.itemType,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create booking';
      throw new BadRequestException(msg);
    }

    const bookingInfo = {
      id: bookingId,
      check_in: bookingEntity.stayPeriod.checkIn,
      check_out: bookingEntity.stayPeriod.checkOut,
      total_price: bookingEntity.totalPrice.amount,
      guests: bookingEntity.guestsCount,
      message: bookingEntity.message,
    };

    void this.sendEmails(
      bookingInfo,
      bookingEntity.guestId,
      hostId,
      propertyTitle,
      bookingEntity.itemType,
    );

    if (hostId && this.notificationsService) {
      this.notificationsService.notifyUser(hostId, {
        type: 'NEW_BOOKING',
        title: 'Новое бронирование!',
        message: `Новая заявка на "${propertyTitle}" с ${bookingEntity.stayPeriod.checkIn} по ${bookingEntity.stayPeriod.checkOut}`,
        data: {
          bookingId,
          itemId: bookingEntity.itemId,
          totalPrice: bookingEntity.totalPrice.amount,
          checkIn: bookingEntity.stayPeriod.checkIn,
          checkOut: bookingEntity.stayPeriod.checkOut,
        },
      });
    }

    return bookingId;
  }

  private async sendEmails(
    booking: {
      id: string;
      check_in: string;
      check_out: string;
      total_price: number;
      guests: number;
      message?: string;
    },
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

  private async invokeEmailWithRetry(
    payload: Record<string, unknown>,
    maxRetries = 3,
  ) {
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
  // Booking Queries (Backward Compatible)
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
  ): Promise<Record<string, unknown>[]> {
    const role = await this.bookingsRepository.getUserRole(requestUserId!);
    if (requestUserId !== hostId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    const properties =
      await this.bookingsRepository.getPropertiesByHost(hostId);
    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p) => String(p.id));
    const propertyMap = new Map(properties.map((p) => [String(p.id), p]));

    const bookings = await this.bookingsRepository.getBookingsByPropertyIds(
      propertyIds,
      dateFrom,
      dateTo,
    );
    if (!bookings || bookings.length === 0) return [];

    const guestIds = Array.from(
      new Set(bookings.map((b) => String(b.user_id)).filter(Boolean)),
    );
    const profiles = await this.bookingsRepository.getProfilesByIds(guestIds);
    const profileMap = new Map((profiles || []).map((p) => [String(p.id), p]));

    return bookings.map((booking) => {
      const prop = propertyMap.get(String(booking.item_id));
      return {
        ...booking,
        user: profileMap.get(String(booking.user_id)),
        property: prop,
        itemTitle: prop?.title,
      };
    });
  }

  // ============================================
  // Booking Mutations & State Transitions
  // ============================================

  async updateBookingStatus(
    id: string,
    status: string,
    reason: string | undefined,
    userId: string,
  ) {
    const currentBooking = await this.bookingsRepository.getBookingById(id);

    if (!currentBooking) throw new NotFoundException('Booking not found');

    const domainBooking = BookingMapper.toDomain(currentBooking);

    const isBookingOwner = domainBooking.guestId === userId;
    const propertyObj = (
      Array.isArray(currentBooking.property)
        ? currentBooking.property[0]
        : currentBooking.property
    ) as PropertySummaryRow | null | undefined;
    const serviceObj = (
      Array.isArray(currentBooking.service)
        ? currentBooking.service[0]
        : currentBooking.service
    ) as ServiceSummaryRow | null | undefined;
    const isPropertyHost = propertyObj?.host_id === userId;
    const isServiceProvider = serviceObj?.provider_id === userId;

    const role = await this.bookingsRepository.getUserRole(userId);
    const isAdmin = role === 'admin';

    if (!isBookingOwner && !isPropertyHost && !isServiceProvider && !isAdmin) {
      throw new UnauthorizedException('Not authorized');
    }

    if (status === 'cancelled') {
      if (isBookingOwner && !isAdmin && !isPropertyHost && !isServiceProvider) {
        if (!domainBooking.canBeCancelledBy(userId)) {
          throw new BadRequestException(
            'Booking cannot be cancelled in its current state',
          );
        }
      }
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
      emailType = domainBooking.isPending()
        ? 'booking_rejected'
        : 'booking_cancelled';

    if (emailType) {
      void this.bookingsRepository.invokeEmailFunction({
        type: emailType,
        userId: domainBooking.guestId,
        data: {
          itemTitle,
          itemTypeLabel: typeLabel,
          checkIn: domainBooking.stayPeriod.checkIn,
          checkOut: domainBooking.stayPeriod.checkOut,
          reason,
          link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/profile`,
        },
      });

      if (status === 'cancelled' && hostId) {
        void this.bookingsRepository.invokeEmailFunction({
          type: 'booking_cancelled_host',
          userId: hostId,
          data: {
            guestName: 'Guest',
            itemTitle,
            itemTypeLabel: typeLabel,
            checkIn: domainBooking.stayPeriod.checkIn,
            checkOut: domainBooking.stayPeriod.checkOut,
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
        void this.bookingsRepository.invokeEmailFunction({
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
