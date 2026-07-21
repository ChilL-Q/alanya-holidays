import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface CreateBookingDto {
  item_id: string;
  user_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  guests: number;
  message?: string;
  payment_method?: string;
  item_type?: string;
}

@Injectable()
export class BookingsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async checkConflict(itemId: string, itemType: string, checkIn: string, checkOut: string) {
    const supabase = this.supabaseService.getClient();
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .not('status', 'in', '("cancelled","rejected")')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    if (overlapError) throw new Error('Failed to query bookings');
    if (overlappingBookings && overlappingBookings.length > 0) return { has_conflict: true, message: 'Dates are already booked' };

    if (itemType === 'property') {
      const { data: blocks, error: blockError } = await supabase
        .from('property_availability')
        .select('id')
        .eq('property_id', itemId)
        .neq('status', 'available')
        .gte('date', checkIn)
        .lt('date', checkOut);
      
      if (blockError) throw new Error('Failed to query availability');
      if (blocks && blocks.length > 0) return { has_conflict: true, message: 'Dates are unavailable' };
    }

    return { has_conflict: false, message: 'Available' };
  }

  async createBooking(dto: CreateBookingDto) {
    const supabase = this.supabaseService.getClient();
    const itemType = dto.item_type || 'property';
    let hostId: string | null = null;
    let propertyTitle = 'Item';
    
    if (itemType === 'property') {
      const { data: property, error: propError } = await supabase.from('properties').select('status, host_id, title').eq('id', dto.item_id).single();
      if (propError || !property) throw new BadRequestException('Property not found');
      if (property.status !== 'approved') throw new BadRequestException('Property is not available');
      if (property.host_id === dto.user_id) throw new BadRequestException('Cannot book your own property');
      hostId = property.host_id;
      propertyTitle = property.title;
    } else if (itemType === 'service') {
      const { data: service, error: servError } = await supabase.from('services').select('status, provider_id, title').eq('id', dto.item_id).single();
      if (servError || !service) throw new BadRequestException('Service not found');
      if (service.status !== 'approved') throw new BadRequestException('Service is not available');
      if (service.provider_id === dto.user_id) throw new BadRequestException('Cannot book your own service');
      hostId = service.provider_id;
      propertyTitle = service.title;
    }

    const conflictResult = await this.checkConflict(dto.item_id, itemType, dto.check_in, dto.check_out);
    if (conflictResult.has_conflict) throw new BadRequestException(conflictResult.message);

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        item_id: dto.item_id,
        item_type: itemType,
        user_id: dto.user_id,
        check_in: dto.check_in,
        check_out: dto.check_out,
        total_price: dto.total_price,
        guests: dto.guests,
        message: dto.message || null,
        payment_method: dto.payment_method || 'card',
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw new Error('Failed to create booking');

    if (itemType === 'property') {
      const checkInDate = new Date(dto.check_in);
      const checkOutDate = new Date(dto.check_out);
      const blocks = [];
      for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
        blocks.push({
          property_id: dto.item_id,
          date: d.toISOString().split('T')[0],
          status: 'booked',
          source: 'reservation',
          external_id: booking.id
        });
      }
      if (blocks.length > 0) await supabase.from('property_availability').upsert(blocks, { onConflict: 'property_id, date' });
    }
    
    this.sendEmails(booking, dto.user_id, hostId, propertyTitle, itemType);
    return booking.id;
  }

  private async sendEmails(booking: any, userId: string, hostId: string | null, title: string, type: string) {
    const supabase = this.supabaseService.getClient();
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      const guestName = profile?.full_name || 'Guest';

      await supabase.functions.invoke('send-email', {
        body: {
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
            link: `${process.env.APP_URL || 'http://localhost:8080'}/profile`
          }
        }
      }).catch(e => console.error(e));

      if (hostId) {
        await supabase.functions.invoke('send-email', {
          body: {
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
              link: `${process.env.APP_URL || 'http://localhost:8080'}/host/bookings`
            }
          }
        }).catch(e => console.error(e));
      }
    } catch (e) {
      console.error('Failed to send emails', e);
    }
  }

  // ============================================
  // Booking Queries (Moved from frontend)
  // ============================================

  async getUserBookings(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: bookings, error } = await supabase.from('bookings').select('*').eq('user_id', userId).order('check_in', { ascending: true });
    if (error) throw new Error(error.message);
    if (!bookings || bookings.length === 0) return [];

    return this.enrichBookings(bookings);
  }

  async getAdminBookings(statusFilter: string | undefined, requestUserId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
    if (profile?.role !== 'admin') throw new UnauthorizedException('Admin access required');

    let query = supabase.from('bookings').select('*');
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data: bookings, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    if (!bookings || bookings.length === 0) return [];

    return this.enrichBookings(bookings, true);
  }

  async getBookingsForHost(hostId: string, dateFrom?: string, dateTo?: string, requestUserId?: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
    if (requestUserId !== hostId && profile?.role !== 'admin') throw new UnauthorizedException('Not authorized');

    const { data: properties } = await supabase.from('properties').select('id, title, images, location').eq('host_id', hostId);
    if (!properties || properties.length === 0) return [];

    const propertyIds = properties.map((p: any) => p.id);
    const propertyMap = new Map(properties.map((p: any) => [p.id, p]));

    let query = supabase.from('bookings').select('*').in('item_id', propertyIds).eq('item_type', 'property').eq('status', 'confirmed').order('check_in', { ascending: true });
    if (dateFrom) query = query.gte('check_out', dateFrom);
    if (dateTo) query = query.lte('check_in', dateTo);

    const { data: bookings, error } = await query;
    if (error) throw new Error(error.message);
    if (!bookings || bookings.length === 0) return [];

    const guestIds = Array.from(new Set(bookings.map((b: any) => b.user_id).filter(Boolean)));
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, avatar_url, phone').in('id', guestIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return bookings.map((booking: any) => ({
      ...booking,
      user: profileMap.get(booking.user_id),
      property: propertyMap.get(booking.item_id),
      itemTitle: propertyMap.get(booking.item_id)?.title
    }));
  }

  private async enrichBookings(bookings: any[], includeUser = false) {
    const supabase = this.supabaseService.getClient();
    const propertyIds = Array.from(new Set(bookings.filter(b => b.item_type === 'property').map(b => b.item_id).filter(Boolean)));
    const serviceIds = Array.from(new Set(bookings.filter(b => b.item_type === 'service').map(b => b.item_id).filter(Boolean)));
    
    let usersMap = new Map();
    if (includeUser) {
      const userIds = Array.from(new Set(bookings.map(b => b.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: users } = await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds);
        usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      }
    }

    const [propertiesResult, servicesResult] = await Promise.all([
      propertyIds.length > 0 ? supabase.from('properties').select('id, title, images, price_per_night, location').in('id', propertyIds) : Promise.resolve({ data: [] }),
      serviceIds.length > 0 ? supabase.from('services').select('id, title, images, price, type').in('id', serviceIds) : Promise.resolve({ data: [] })
    ]);

    const propertyMap = new Map((propertiesResult.data || []).map((p: any) => [p.id, p]));
    const serviceMap = new Map((servicesResult.data || []).map((s: any) => [s.id, s]));

    return bookings.map(booking => {
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
        ...(includeUser ? { user: usersMap.get(booking.user_id) } : {}) 
      };
    });
  }

  // ============================================
  // Booking Mutations (Moved from frontend)
  // ============================================

  async updateBookingStatus(id: string, status: string, reason: string | undefined, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('status, user_id, check_in, check_out, property:properties(title, host_id), service:services(title, provider_id)')
      .eq('id', id)
      .single();

    if (fetchError || !currentBooking) throw new NotFoundException('Booking not found');

    const isBookingOwner = currentBooking.user_id === userId;
    const propertyObj = Array.isArray(currentBooking.property) ? currentBooking.property[0] : currentBooking.property;
    const serviceObj = Array.isArray(currentBooking.service) ? currentBooking.service[0] : currentBooking.service;
    const isPropertyHost = propertyObj?.host_id === userId;
    const isServiceProvider = serviceObj?.provider_id === userId;
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (!isBookingOwner && !isPropertyHost && !isServiceProvider && profile?.role !== 'admin') {
      throw new UnauthorizedException('Not authorized');
    }

    if (status === 'cancelled') {
      await supabase.rpc('unblock_dates_for_booking', { p_booking_id: id }).catch(console.error);
    }

    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);

    // Logging & Emails
    const typeLabel = propertyObj ? 'Property' : (serviceObj ? 'Service' : 'Item');
    const itemTitle = propertyObj?.title || serviceObj?.title || 'Item';
    const hostId = propertyObj?.host_id || serviceObj?.provider_id;

    let emailType: string | null = null;
    if (status === 'confirmed') emailType = 'booking_confirmed';
    else if (status === 'cancelled') emailType = currentBooking.status === 'pending' ? 'booking_rejected' : 'booking_cancelled';

    if (emailType) {
      supabase.functions.invoke('send-email', {
        body: {
          type: emailType,
          userId: currentBooking.user_id,
          data: { itemTitle, itemTypeLabel, checkIn: currentBooking.check_in, checkOut: currentBooking.check_out, reason, link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/profile` }
        }
      }).catch(console.error);

      if (status === 'cancelled' && hostId) {
        supabase.functions.invoke('send-email', {
          body: {
            type: 'booking_cancelled_host',
            userId: hostId,
            data: { guestName: 'Guest', itemTitle, itemTypeLabel, checkIn: currentBooking.check_in, checkOut: currentBooking.check_out, link: `${process.env.APP_URL || 'https://alanyaholidays.com'}/host/bookings` }
          }
        }).catch(console.error);
      }
    }
    return { success: true };
  }

  async cancelBooking(id: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: booking, error: fetchError } = await supabase.from('bookings').select('created_at, status, user_id').eq('id', id).single();
    if (fetchError || !booking) throw new NotFoundException('Booking not found');
    
    // Authorization is handled inside updateBookingStatus, but we ensure it's either user or admin
    return this.updateBookingStatus(id, 'cancelled', 'User initiated cancellation', userId);
  }

  async updatePayoutStatus(id: string, payoutStatus: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role !== 'admin') throw new UnauthorizedException('Admin access required');

    const { error } = await supabase.from('bookings').update({ payout_status: payoutStatus }).eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
