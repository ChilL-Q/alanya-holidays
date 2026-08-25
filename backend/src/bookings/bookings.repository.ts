import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BookingEntity,
  BookingStatus,
  BookingTransitionResult,
  IBookingsRepository,
  StayPeriod,
} from './domain';
import {
  DatabaseException,
  EntityNotFoundException,
  InvalidStatusTransitionException,
  BookingConflictException,
} from '../common/domain/exceptions';
import { BookingMapper } from './infrastructure/booking.mapper';
import {
  PropertySummaryRow,
  ServiceSummaryRow,
  ProfileSummaryRow,
  EnrichedBookingRow,
} from './dto/booking-repository.dto';

@Injectable()
export class BookingsRepository implements IBookingsRepository {
  private readonly logger = new Logger(BookingsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  /**
   * Domain Repository implementation: find single booking by ID.
   */
  async findById(id: string): Promise<BookingEntity | null> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return BookingMapper.toDomain(data);
  }

  /**
   * Domain Repository implementation: find overlapping active bookings for an item and stay period.
   * Supports both StayPeriod value object and legacy (checkIn, checkOut) strings.
   */
  async findOverlappingBookings(
    itemId: string,
    itemType: string,
    checkInOrPeriod: StayPeriod | string,
    checkOut?: string,
  ): Promise<BookingEntity[]> {
    let checkInStr: string;
    let checkOutStr: string;

    if (checkInOrPeriod instanceof StayPeriod) {
      checkInStr = checkInOrPeriod.checkIn;
      checkOutStr = checkInOrPeriod.checkOut;
    } else {
      checkInStr = checkInOrPeriod;
      checkOutStr = checkOut || '';
    }

    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .not('status', 'in', '(cancelled,rejected)')
      .lt('check_in', checkOutStr)
      .gt('check_out', checkInStr);

    if (error) throw new Error('Failed to query bookings');
    return (data || []).map((row: Record<string, unknown>) =>
      BookingMapper.toDomain(row),
    );
  }

  /**
   * Domain Repository implementation: find all bookings for a guest ID.
   */
  async findByGuestId(guestId: string): Promise<BookingEntity[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('user_id', guestId)
      .order('check_in', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map((row: Record<string, unknown>) =>
      BookingMapper.toDomain(row),
    );
  }

  /**
   * Domain Repository implementation: save or persist a BookingEntity.
   */
  async save(booking: BookingEntity): Promise<BookingEntity> {
    const persistenceData = BookingMapper.toPersistence(booking);
    const { data, error } = await this.client
      .from('bookings')
      .upsert(persistenceData)
      .select()
      .single();

    if (error) throw new Error(`Failed to save booking: ${error.message}`);
    return BookingMapper.toDomain(data);
  }

  /**
   * Domain Repository implementation: update booking status.
   */
  async updateStatus(id: string, status: BookingStatus): Promise<void> {
    const { error } = await this.client
      .from('bookings')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  /**
   * Atomic booking status transition via PostgreSQL RPC with row-level locking (SELECT ... FOR UPDATE).
   */
  async transitionStatus(params: {
    bookingId: string;
    newStatus: BookingStatus;
    userId?: string;
    reason?: string;
    paymentStatus?: string;
  }): Promise<BookingTransitionResult> {
    const { data, error } = (await this.client.rpc(
      'transition_booking_status',
      {
        p_booking_id: params.bookingId,
        p_new_status: params.newStatus,
        p_user_id: params.userId || null,
        p_reason: params.reason || null,
        p_payment_status: params.paymentStatus || null,
      },
    )) as {
      data: unknown;
      error: { message: string; code?: string } | null;
    };

    if (error) {
      throw new DatabaseException(
        `Failed to transition booking status: ${error.message}`,
        error,
        error.code,
      );
    }

    const result = data as {
      success: boolean;
      code: string;
      error?: string;
      data?: {
        id: string;
        old_status: BookingStatus;
        new_status: BookingStatus;
        unblocked_dates_count: number;
        item_id: string;
        item_type: string;
        user_id: string;
        check_in: string;
        check_out: string;
        total_price: number;
      };
    } | null;

    if (!result || !result.success) {
      if (result?.code === 'NOT_FOUND') {
        throw new EntityNotFoundException('Booking', params.bookingId);
      }
      if (result?.code === 'INVALID_STATUS_TRANSITION') {
        throw new InvalidStatusTransitionException(
          result.error || 'Invalid status transition',
        );
      }
      throw new BookingConflictException(
        result?.error || 'Booking transition failed',
      );
    }

    const payload = result.data!;
    return {
      id: payload.id,
      oldStatus: payload.old_status,
      newStatus: payload.new_status,
      unblockedDatesCount: payload.unblocked_dates_count,
      itemId: payload.item_id,
      itemType: payload.item_type,
      userId: payload.user_id,
      checkIn: payload.check_in,
      checkOut: payload.check_out,
      totalPrice: payload.total_price,
    };
  }

  // =========================================================================
  // Existing Repository Queries & RPC Optimizations (100% Backward Compatible)
  // =========================================================================

  async checkPropertyAvailabilityBlocks(
    itemId: string,
    checkIn: string,
    checkOut: string,
  ) {
    const { data, error } = await this.client
      .from('property_availability')
      .select('id')
      .eq('property_id', itemId)
      .neq('status', 'available')
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (error) throw new Error('Failed to query availability');
    return data || [];
  }

  async insertBooking(data: Record<string, unknown>) {
    const { data: booking, error } = await this.client
      .from('bookings')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error('Failed to create booking');
    return booking;
  }

  async createBookingRpc(params: {
    itemId: string;
    userId: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    guests: number;
    message?: string;
    paymentMethod?: string;
    itemType?: string;
  }): Promise<string> {
    const res = await this.client.rpc('create_booking', {
      p_item_id: params.itemId,
      p_user_id: params.userId,
      p_check_in: params.checkIn,
      p_check_out: params.checkOut,
      p_total_price: params.totalPrice,
      p_guests: params.guests,
      p_message: params.message || null,
      p_payment_method: params.paymentMethod || 'card',
      p_item_type: params.itemType || 'property',
    });

    if (res.error) throw new Error(res.error.message);
    const result = res.data as { error?: string; data?: string } | null;
    if (result?.error) throw new Error(result.error);
    if (!result?.data) throw new Error('No booking ID returned');
    return result.data;
  }

  async upsertPropertyAvailability(blocks: Record<string, unknown>[]) {
    if (blocks.length > 0) {
      const { error } = await this.client
        .from('property_availability')
        .upsert(blocks, { onConflict: 'property_id, date' });
      if (error)
        throw new Error('Failed to upsert property availability blocks');
    }
  }

  private async enrichBookingsWithItems(
    bookings: Record<string, unknown>[],
  ): Promise<EnrichedBookingRow[]> {
    if (!bookings || !bookings.length) return [];

    const propertyIds = [
      ...new Set(
        bookings
          .map((b) => (b.item_id || b.property_id) as string)
          .filter(Boolean),
      ),
    ];
    const serviceIds = [
      ...new Set(
        bookings
          .map((b) => (b.item_id || b.service_id) as string)
          .filter(Boolean),
      ),
    ];
    const userIds = [
      ...new Set(bookings.map((b) => b.user_id as string).filter(Boolean)),
    ];

    const [propertiesRes, servicesRes, profilesRes] = await Promise.all([
      propertyIds.length
        ? this.client
            .from('properties')
            .select('id, title, images, price_per_night, location, host_id')
            .in('id', propertyIds)
        : Promise.resolve({ data: [] as PropertySummaryRow[] }),
      serviceIds.length
        ? this.client
            .from('services')
            .select('id, title, images, price, type, provider_id')
            .in('id', serviceIds)
        : Promise.resolve({ data: [] as ServiceSummaryRow[] }),
      userIds.length
        ? this.client
            .from('profiles')
            .select('id, full_name, email, avatar_url, phone')
            .in('id', userIds)
        : Promise.resolve({ data: [] as ProfileSummaryRow[] }),
    ]);

    const propertiesMap = new Map<string, PropertySummaryRow>(
      (propertiesRes.data || []).map((p) => [p.id, p]),
    );
    const servicesMap = new Map<string, ServiceSummaryRow>(
      (servicesRes.data || []).map((s) => [s.id, s]),
    );
    const profilesMap = new Map<string, ProfileSummaryRow>(
      (profilesRes.data || []).map((p) => [p.id, p]),
    );

    return bookings.map(
      (booking: Record<string, unknown>): EnrichedBookingRow => {
        const propId = (booking.item_id || booking.property_id) as string;
        const servId = (booking.item_id || booking.service_id) as string;
        const property = propertiesMap.get(propId) || null;
        const service = servicesMap.get(servId) || null;
        const user = profilesMap.get(booking.user_id as string) || null;

        return {
          ...booking,
          id: String(booking.id),
          property,
          service,
          user,
          itemTitle:
            property?.title ||
            service?.title ||
            (typeof booking.itemTitle === 'string'
              ? booking.itemTitle
              : undefined),
        };
      },
    );
  }

  async getUserBookings(userId: string): Promise<EnrichedBookingRow[]> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('check_in', { ascending: true });

    if (error) throw new Error(error.message);
    return await this.enrichBookingsWithItems(data || []);
  }

  async getAdminBookings(statusFilter?: string): Promise<EnrichedBookingRow[]> {
    let query = this.client.from('bookings').select('*');

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    // Bounded until a real pagination need exists — unbounded enrichment
    // (properties/services/guests per row) would scale linearly with data.
    const { data, error } = await query
      .order('created_at', {
        ascending: false,
      })
      .limit(200);

    if (error) throw new Error(error.message);
    return await this.enrichBookingsWithItems(data || []);
  }

  async getBookingsByPropertyIds(
    propertyIds: string[],
    dateFrom?: string,
    dateTo?: string,
  ) {
    let query = this.client
      .from('bookings')
      .select('*')
      .in('item_id', propertyIds)
      .eq('item_type', 'property')
      .eq('status', 'confirmed')
      .order('check_in', { ascending: true });

    if (dateFrom) query = query.gte('check_out', dateFrom);
    if (dateTo) query = query.lte('check_in', dateTo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBookingById(id: string): Promise<EnrichedBookingRow | null> {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    const [enriched] = await this.enrichBookingsWithItems([data]);
    return enriched || null;
  }

  async getBookingForCancellation(id: string) {
    const { data, error } = await this.client
      .from('bookings')
      .select('created_at, status, user_id')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async unblockDatesForBooking(id: string) {
    try {
      await this.client.rpc('unblock_dates_for_booking', { p_booking_id: id });
    } catch (e) {
      this.logger.error(
        `Failed to unblock dates for booking ${id}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
  }

  async getPayoutStatus(id: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('bookings')
      .select('payout_status')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return (data.payout_status as string) ?? null;
  }

  async updatePayoutStatus(id: string, payoutStatus: string) {
    const { error } = await this.client
      .from('bookings')
      .update({ payout_status: payoutStatus })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // --- QUERY HELPER FUNCTIONS FOR APPLICATION SERVICE ---

  async getProperty(id: string): Promise<{
    status: string | null;
    host_id: string | null;
    title: string;
    price_per_night: number | null;
    cleaning_fee: number | null;
    currency: string | null;
  } | null> {
    const { data } = await this.client
      .from('properties')
      .select('status, host_id, title, price_per_night, cleaning_fee, currency')
      .eq('id', id)
      .single();
    return data;
  }

  async getService(id: string): Promise<{
    status: string | null;
    provider_id: string | null;
    title: string;
    price: number | null;
    currency: string | null;
    price_unit: string | null;
  } | null> {
    const { data } = await this.client
      .from('services')
      .select('status, provider_id, title, price, currency, price_unit')
      .eq('id', id)
      .single();
    return data;
  }

  async getProfile(userId: string): Promise<{
    full_name: string | null;
    role: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null> {
    const { data } = await this.client
      .from('profiles')
      .select('full_name, role, email, avatar_url, phone')
      .eq('id', userId)
      .single();
    return data;
  }

  async getProfilesByIds(userIds: string[]) {
    const { data } = await this.client
      .from('profiles')
      .select('id, full_name, email, avatar_url, phone')
      .in('id', userIds);
    return data || [];
  }

  async getPropertiesByHost(hostId: string) {
    const { data } = await this.client
      .from('properties')
      .select('id, title, images, location')
      .eq('host_id', hostId);
    return data || [];
  }

  async getPropertiesByIds(propertyIds: string[]) {
    const { data } = await this.client
      .from('properties')
      .select('id, title, images, price_per_night, location')
      .in('id', propertyIds);
    return data || [];
  }

  async getServicesByIds(serviceIds: string[]) {
    const { data } = await this.client
      .from('services')
      .select('id, title, images, price, type')
      .in('id', serviceIds);
    return data || [];
  }

  async confirmBookingsFromStripe(
    bookingIds: string[],
    userId: string,
    sessionId: string,
    paymentIntentId?: string | null,
  ): Promise<
    Array<{
      id: string;
      status?: string;
      payment_status?: string;
      check_in?: string;
      check_out?: string;
      guests?: number;
      property?: { title?: string } | null;
      service?: { title?: string } | null;
      profile?: { email?: string } | null;
    }>
  > {
    if (!bookingIds.length) return [];

    // Fast Path: Atomic RPC with row locking, ownership check & joined details (1 RTT)
    try {
      interface BookingRpcRow {
        id: string;
        status: string;
        payment_status: string;
        check_in?: string | null;
        check_out?: string | null;
        guests?: number | string | null;
        property_title?: string | null;
        service_title?: string | null;
        guest_email?: string | null;
      }

      const response = (await this.client.rpc('confirm_bookings_from_stripe', {
        p_booking_ids: bookingIds,
        p_user_id: userId,
        p_session_id: sessionId,
        p_payment_intent_id: paymentIntentId || null,
      })) as {
        data: BookingRpcRow[] | null;
        error: { message: string } | null;
      };

      if (!response.error && Array.isArray(response.data)) {
        return response.data.map((row) => ({
          id: String(row.id),
          status: String(row.status),
          payment_status: String(row.payment_status),
          check_in: row.check_in ? String(row.check_in) : undefined,
          check_out: row.check_out ? String(row.check_out) : undefined,
          guests: Number(row.guests) || 1,
          property: row.property_title
            ? { title: String(row.property_title) }
            : null,
          service: row.service_title
            ? { title: String(row.service_title) }
            : null,
          profile: row.guest_email ? { email: String(row.guest_email) } : null,
        }));
      }
    } catch {
      // Graceful fallback for mock environments or legacy database replicas
    }

    // Fallback: 3 RTT legacy flow
    const { data: ownedBookings, error: ownerCheckError } = await this.client
      .from('bookings')
      .select('id')
      .in('id', bookingIds)
      .eq('user_id', userId);

    if (ownerCheckError) throw new Error('Ownership check failed');

    const ownedIds = (ownedBookings ?? []).map((b: { id: string }) => b.id);
    const unauthorized = bookingIds.filter((id) => !ownedIds.includes(id));
    if (unauthorized.length > 0) {
      throw new Error(
        `Unauthorized booking IDs in Stripe session: ${unauthorized.join(', ')}`,
      );
    }

    const updatePayload: Record<string, unknown> = {
      status: 'confirmed',
      payment_status: 'paid',
    };
    if (paymentIntentId) {
      updatePayload.payment_intent_id = paymentIntentId;
    }

    const { data: updatedRows, error } = await this.client
      .from('bookings')
      .update(updatePayload)
      .in('id', bookingIds)
      .eq('status', 'pending')
      .eq('stripe_session_id', sessionId)
      .select('id');

    if (error) throw new Error(`DB update failed: ${error.message}`);
    return updatedRows || [];
  }

  async getConfirmedBookingsDetails(bookingIds: string[]) {
    const { data, error } = await this.client
      .from('bookings')
      .select(
        `
        id, check_in, check_out, guests,
        property:properties(title),
        service:services(title),
        profile:profiles!bookings_user_id_fkey(email)
      `,
      )
      .in('id', bookingIds);

    if (error) return [];
    return data || [];
  }
}
