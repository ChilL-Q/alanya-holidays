import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BookingEntity,
  BookingStatus,
  IBookingsRepository,
  StayPeriod,
} from './domain';
import { BookingMapper } from './infrastructure/booking.mapper';
import {
  PropertySummaryRow,
  ServiceSummaryRow,
  ProfileSummaryRow,
  EnrichedBookingRow,
} from './dto/booking-repository.dto';

@Injectable()
export class BookingsRepository implements IBookingsRepository {
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
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

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

  async updateBookingStatus(id: string, status: string) {
    const { error } = await this.client
      .from('bookings')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async unblockDatesForBooking(id: string) {
    try {
      await this.client.rpc('unblock_dates_for_booking', { p_booking_id: id });
    } catch (e) {
      console.error(e);
    }
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
  } | null> {
    const { data } = await this.client
      .from('properties')
      .select('status, host_id, title')
      .eq('id', id)
      .single();
    return data;
  }

  async getService(id: string): Promise<{
    status: string | null;
    provider_id: string | null;
    title: string;
  } | null> {
    const { data } = await this.client
      .from('services')
      .select('status, provider_id, title')
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

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
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

  async invokeEmailFunction(payload: Record<string, unknown>): Promise<void> {
    await this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err: unknown) => console.error(err));
  }

  async confirmBookingsFromStripe(
    bookingIds: string[],
    userId: string,
    sessionId: string,
    paymentIntentId?: string | null,
  ) {
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
