import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { BookingsRepository } from './bookings.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ConfirmedBookingDetails } from './dto/booking-notification.dto';
import {
  BookingEntity,
  BookingItemType,
  BookingStatus,
  Money,
  StayPeriod,
} from './domain';
import { BookingMapper } from './infrastructure/booking.mapper';
import {
  PropertySummaryRow,
  ServiceSummaryRow,
} from './dto/booking-repository.dto';
import { EmailOutboxRepository } from './email-outbox.repository';
import {
  PAYOUT_STATUSES,
  PAYOUT_STATUS_TRANSITIONS,
  PayoutStatus,
} from './dto/update-payout-status.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingsRepository: BookingsRepository,
    private readonly emailOutbox: EmailOutboxRepository,
    private readonly notificationsService: NotificationsService,
    @Optional() private readonly userRolesRepo?: UserRolesRepository,
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

  async createBooking(dto: CreateBookingDto, guestId: string) {
    const itemType = (dto.item_type || 'property') as BookingItemType;

    // Validate domain invariants through Value Objects and BookingEntity factory
    let stayPeriod: StayPeriod;
    let bookingEntity: BookingEntity;

    try {
      stayPeriod = new StayPeriod(dto.check_in, dto.check_out);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Invalid booking details';
      throw new BadRequestException(msg);
    }

    const { hostId, itemTitle, totalPrice } = await this.resolveBookingContext(
      dto,
      guestId,
      itemType,
      stayPeriod,
    );

    try {
      bookingEntity = BookingEntity.create({
        itemId: dto.item_id,
        itemType,
        guestId,
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
      itemTitle,
      bookingEntity.itemType,
    );

    if (hostId && this.notificationsService) {
      this.notificationsService.notifyUser(hostId, {
        type: 'NEW_BOOKING',
        title: 'Новое бронирование!',
        message: `Новая заявка на "${itemTitle}" с ${bookingEntity.stayPeriod.checkIn} по ${bookingEntity.stayPeriod.checkOut}`,
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

  private async resolveBookingContext(
    dto: CreateBookingDto,
    guestId: string,
    itemType: BookingItemType,
    stayPeriod: StayPeriod,
  ): Promise<{
    hostId: string | null;
    itemTitle: string;
    totalPrice: Money;
  }> {
    if (itemType === 'property') {
      const property = await this.bookingsRepository.getProperty(dto.item_id);
      if (!property) throw new BadRequestException('Property not found');
      if (property.status !== 'approved') {
        throw new BadRequestException('Property is not available');
      }
      if (property.host_id === guestId) {
        throw new BadRequestException('Cannot book your own property');
      }

      const currency = property.currency ?? 'EUR';
      const nightlyPrice = new Money(property.price_per_night ?? 0, currency);
      const nights = stayPeriod.getNightsCount();
      let totalPrice = nightlyPrice.multiply(nights);

      if (
        property.cleaning_fee !== null &&
        property.cleaning_fee !== undefined
      ) {
        totalPrice = totalPrice.add(new Money(property.cleaning_fee, currency));
      }

      return {
        hostId: property.host_id,
        itemTitle: property.title,
        totalPrice,
      };
    }

    if (itemType === 'service') {
      const service = await this.bookingsRepository.getService(dto.item_id);
      if (!service) throw new BadRequestException('Service not found');
      if (service.status !== 'approved') {
        throw new BadRequestException('Service is not available');
      }
      if (service.provider_id === guestId) {
        throw new BadRequestException('Cannot book your own service');
      }

      const currency = service.currency ?? 'EUR';
      const unitPrice = new Money(service.price ?? 0, currency);
      const normalizedPriceUnit = service.price_unit?.toLowerCase();
      const units =
        normalizedPriceUnit === 'per_person'
          ? dto.guests
          : normalizedPriceUnit === 'per_day' ||
              normalizedPriceUnit === 'per_night'
            ? stayPeriod.getNightsCount()
            : 1;

      return {
        hostId: service.provider_id,
        itemTitle: service.title,
        totalPrice: unitPrice.multiply(units),
      };
    }

    throw new BadRequestException('Unsupported booking item type');
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

      await this.emailOutbox.enqueue({
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
        await this.emailOutbox.enqueue({
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
      this.logger.error(
        'Failed to send emails',
        e instanceof Error ? e.stack : undefined,
      );
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
    _requestUserId?: string,
  ) {
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
    const role = requestUserId
      ? await this.userRolesRepo?.getRole(requestUserId)
      : undefined;
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

    const role = await this.userRolesRepo?.getRole(userId);
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
    }

    // Execute atomic DB RPC (Locks row, verifies transition, deletes dates atomically, updates status)
    const transition = await this.bookingsRepository.transitionStatus({
      bookingId: id,
      newStatus: status as BookingStatus,
      userId,
      reason,
    });

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
        transition.oldStatus === 'pending' || domainBooking.isPending()
          ? 'booking_rejected'
          : 'booking_cancelled';

    if (emailType) {
      await this.emailOutbox.enqueue({
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
        await this.emailOutbox.enqueue({
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
    return { success: true, transition };
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

  async updatePayoutStatus(id: string, payoutStatus: string, _userId?: string) {
    // Defense-in-depth: whitelist against DB enum public.payout_status
    if (!PAYOUT_STATUSES.includes(payoutStatus as PayoutStatus))
      throw new BadRequestException(
        `payoutStatus must be one of: ${PAYOUT_STATUSES.join(', ')}`,
      );

    const nextStatus = payoutStatus as PayoutStatus;
    const currentStatus = await this.bookingsRepository.getPayoutStatus(id);
    if (currentStatus === null)
      throw new NotFoundException('Booking not found');

    // Enforce the payout state machine; same-value writes stay idempotent.
    const allowedTransitions =
      PAYOUT_STATUS_TRANSITIONS[currentStatus as PayoutStatus];
    if (
      currentStatus !== nextStatus &&
      !allowedTransitions?.includes(nextStatus)
    ) {
      throw new BadRequestException(
        `Invalid payout status transition: ${currentStatus} -> ${nextStatus}`,
      );
    }

    await this.bookingsRepository.updatePayoutStatus(id, nextStatus);
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

    // If details were already returned by atomic RPC (fast path)
    const hasJoinedDetails = updatedRows.some(
      (r) => r.property || r.service || r.profile,
    );

    const bookings: ConfirmedBookingDetails[] = hasJoinedDetails
      ? updatedRows
      : ((await this.bookingsRepository.getConfirmedBookingsDetails(
          confirmedIds,
        )) as ConfirmedBookingDetails[]);

    for (const booking of bookings) {
      const itemTitle =
        booking.property?.title ?? booking.service?.title ?? 'Booking';
      const guestEmail = booking.profile?.email;
      if (guestEmail) {
        await this.emailOutbox.enqueue({
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
