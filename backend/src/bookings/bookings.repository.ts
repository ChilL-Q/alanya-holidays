import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BookingsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async findOverlappingBookings(
    itemId: string,
    itemType: string,
    checkIn: string,
    checkOut: string,
  ) {
    const { data, error } = await this.client
      .from('bookings')
      .select('id')
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .not('status', 'in', '(cancelled,rejected)')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    if (error) throw new Error('Failed to query bookings');
    return data || [];
  }

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

  async insertBooking(data: any) {
    const { data: booking, error } = await this.client
      .from('bookings')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error('Failed to create booking');
    return booking;
  }

  async upsertPropertyAvailability(blocks: any[]) {
    if (blocks.length > 0) {
      const { error } = await this.client
        .from('property_availability')
        .upsert(blocks, { onConflict: 'property_id, date' });
      if (error)
        throw new Error('Failed to upsert property availability blocks');
    }
  }

  async getUserBookings(userId: string) {
    const { data, error } = await this.client
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('check_in', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAdminBookings(statusFilter?: string) {
    let query = this.client.from('bookings').select('*');
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) throw new Error(error.message);
    return data || [];
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

  async getBookingById(id: string) {
    const { data, error } = await this.client
      .from('bookings')
      .select(
        'status, user_id, check_in, check_out, property:properties(title, host_id), service:services(title, provider_id)',
      )
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
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

  // --- ADDED MISSING FUNCTIONS FOR SERVICE ---

  async getProperty(id: string) {
    const { data } = await this.client
      .from('properties')
      .select('status, host_id, title')
      .eq('id', id)
      .single();
    return data;
  }

  async getService(id: string) {
    const { data } = await this.client
      .from('services')
      .select('status, provider_id, title')
      .eq('id', id)
      .single();
    return data;
  }

  async getProfile(userId: string) {
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

  invokeEmailFunction(payload: any) {
    this.client.functions
      .invoke('send-email', { body: payload })
      .catch((err) => console.error(err));
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
      throw new Error(`Unauthorized booking IDs in Stripe session: ${unauthorized.join(', ')}`);
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
      .select(`
        id, check_in, check_out, guests,
        property:properties(title),
        service:services(title),
        profile:profiles!bookings_user_id_fkey(email)
      `)
      .in('id', bookingIds);

    if (error) return [];
    return data || [];
  }
}
