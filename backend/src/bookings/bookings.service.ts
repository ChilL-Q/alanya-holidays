import { Injectable, BadRequestException } from '@nestjs/common';
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

    // 1. Check overlapping active bookings
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .not('status', 'in', '("cancelled","rejected")')
      .lt('check_in', checkOut)
      .gt('check_out', checkIn);

    if (overlapError) throw new Error('Failed to query bookings');
    if (overlappingBookings && overlappingBookings.length > 0) {
      return { has_conflict: true, message: 'Dates are already booked' };
    }

    // 2. Check manual availability blocks
    if (itemType === 'property') {
      const { data: blocks, error: blockError } = await supabase
        .from('property_availability')
        .select('id')
        .eq('property_id', itemId)
        .neq('status', 'available')
        .gte('date', checkIn)
        .lt('date', checkOut);
      
      if (blockError) throw new Error('Failed to query availability');
      if (blocks && blocks.length > 0) {
        return { has_conflict: true, message: 'Dates are unavailable' };
      }
    }

    return { has_conflict: false, message: 'Available' };
  }

  async createBooking(dto: CreateBookingDto) {
    const supabase = this.supabaseService.getClient();
    const itemType = dto.item_type || 'property';

    // Validation for property
    let hostId: string | null = null;
    let propertyTitle = 'Item';
    
    if (itemType === 'property') {
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('status, host_id, title')
        .eq('id', dto.item_id)
        .single();
        
      if (propError || !property) throw new BadRequestException('Property not found');
      if (property.status !== 'approved') throw new BadRequestException('Property is not available');
      if (property.host_id === dto.user_id) throw new BadRequestException('Cannot book your own property');
      
      hostId = property.host_id;
      propertyTitle = property.title;
    } else if (itemType === 'service') {
      const { data: service, error: servError } = await supabase
        .from('services')
        .select('status, provider_id, title')
        .eq('id', dto.item_id)
        .single();
        
      if (servError || !service) throw new BadRequestException('Service not found');
      if (service.status !== 'approved') throw new BadRequestException('Service is not available');
      if (service.provider_id === dto.user_id) throw new BadRequestException('Cannot book your own service');
      
      hostId = service.provider_id;
      propertyTitle = service.title;
    }

    // Conflict Check
    const conflictResult = await this.checkConflict(dto.item_id, itemType, dto.check_in, dto.check_out);
    if (conflictResult.has_conflict) {
      throw new BadRequestException(conflictResult.message);
    }

    // Insert Booking
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

    // Block Dates (if property)
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

      if (blocks.length > 0) {
        await supabase.from('property_availability').upsert(blocks, { onConflict: 'property_id, date' });
      }
    }
    
    // Asynchronous Emails (Fire and forget, but in a real app would use a queue)
    this.sendEmails(booking, dto.user_id, hostId, propertyTitle, itemType);

    return { data: booking.id };
  }

  private async sendEmails(booking: any, userId: string, hostId: string | null, title: string, type: string) {
    const supabase = this.supabaseService.getClient();
    try {
      // 1. Get user name
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      const guestName = profile?.full_name || 'Guest';

      // 2. Invoke email function for Guest
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
      });

      // 3. Invoke email function for Host
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
        });
      }
    } catch (e) {
      console.error('Failed to send emails', e);
    }
  }
}
