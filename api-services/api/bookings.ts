import { supabase } from '../supabase';
import { Booking, PropertyDB, ServiceDB, UserProfile } from '../../types/index';
import { bookingSchema } from './schemas';
import { getAppUrl } from '../../utils/appUrl';
import { retry } from '../../utils/retry';
import { createAuditLog } from './audit';
import { z } from 'zod';

export type BookingCreateInput = Omit<z.infer<typeof bookingSchema>, 'item_type' | 'payment_method'> & { 
    item_type?: 'property' | 'service' | 'product' | string;
    payment_method?: string;
    type?: string; // Legacy field support
    title?: string; 
    status?: string; // Legacy field support
    payment_status?: string; // Legacy field support
};

export type EnrichedBooking = Booking & {
    user?: Partial<UserProfile>;
    itemTitle?: string;
};

export const bookingsService = {


    async createBooking(data: BookingCreateInput) {
         // Map legacy 'type' to 'item_type' if needed for backward compatibility
         const input = {
             ...data,
             item_type: data.item_type || data.type || 'property'
         };

         // Validate Input
         const validatedData = bookingSchema.parse(input);

         const rpcParams = {
            p_item_id: validatedData.item_id, 
            p_user_id: validatedData.user_id,
            p_check_in: validatedData.check_in,
            p_check_out: validatedData.check_out,
            p_total_price: validatedData.total_price,
            p_guests: validatedData.guests,
            p_message: validatedData.message,
            p_payment_method: validatedData.payment_method,
            p_item_type: validatedData.item_type
        };

        const { data: result, error } = await supabase.rpc('create_booking', rpcParams);

        if (error) throw error;
        if (result.error) throw new Error(result.error);

        // Trigger Email Notification (Non-blocking)
        const bookingId = result.data;
        const itemTypeLabel = input.item_type === 'service' ? 'Service' : 'Property';

        // Получаем имя гостя один раз для обоих писем
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', validatedData.user_id)
            .single();

        const guestName = profile?.full_name || 'Guest';

        // Log booking creation
        createAuditLog('BOOKING_CREATED', { 
            bookingId, 
            userId: validatedData.user_id, 
            itemId: validatedData.item_id, 
            itemType: input.item_type 
        });

        retry(() => supabase.functions.invoke('send-email', {
            body: {
                type: 'booking_created',
                userId: validatedData.user_id,
                data: {
                    userName: guestName,
                    itemTitle: data.title || 'Item',
                    itemTypeLabel: itemTypeLabel,
                    checkIn: validatedData.check_in,
                    checkOut: validatedData.check_out,
                    totalPrice: validatedData.total_price,
                    guests: validatedData.guests,
                    link: getAppUrl('/profile')
                }
            }
        })).catch(err => console.error('Failed to send email:', err));

        // Notify Host (New Feature)
        // Correctly identify table based on type
        const table = input.item_type === 'service' ? 'services' : 'properties';
        const ownerParams = input.item_type === 'service' ? 'provider_id, title' : 'host_id, title';

        supabase.from(table).select(ownerParams).eq('id', validatedData.item_id).single()
            .then(({ data: item }) => {
                const itemData = item as any;
                const hostId = itemData ? (itemData.host_id || itemData.provider_id) : null;

                if (hostId) {
                    retry(() => supabase.functions.invoke('send-email', {
                        body: {
                            type: 'booking_request_host',
                            userId: hostId,
                            data: {
                                guestName: guestName,
                                itemTitle: itemData.title,
                                itemTypeLabel: itemTypeLabel,
                                checkIn: validatedData.check_in,
                                checkOut: validatedData.check_out,
                                totalPrice: validatedData.total_price,
                                guests: validatedData.guests,
                                message: validatedData.message, // Include user message
                                link: getAppUrl('/host/bookings')
                            }
                        }
                    })).catch(err => console.error('Failed to send host email:', err));
                }
            });

        return { id: bookingId as string };
    },
    
    // Original unsafe method kept as reference if needed (renamed internal or just removed)
    // async createBookingLegacy(data: any) { ... }

    async getBookings(userId: string): Promise<EnrichedBooking[]> {
        // Verify the requesting user is fetching their own bookings
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        if (user.id !== userId && user.user_metadata?.role !== 'admin') {
            throw new Error('Not authorized');
        }

        // 1. Fetch raw bookings
        const query = supabase.from('bookings').select('*').eq('user_id', userId);

        const { data: bookings, error } = await query.order('check_in', { ascending: true });

        if (error) throw error;
        if (!bookings || bookings.length === 0) return [];

        // 2. Batch Fetching Details
        const propertyIds = bookings
            .filter(b => b.item_type === 'property')
            .map(b => b.item_id);
            
        const serviceIds = bookings
            .filter(b => b.item_type === 'service')
            .map(b => b.item_id);

        const [propertiesResult, servicesResult] = await Promise.all([
            propertyIds.length > 0 
                ? supabase.from('properties').select('id, title, images, price_per_night, location').in('id', propertyIds)
                : Promise.resolve({ data: [] as any[], error: null }),
            serviceIds.length > 0
                ? supabase.from('services').select('id, title, images, price, type').in('id', serviceIds)
                : Promise.resolve({ data: [] as any[], error: null })
        ]);

        if (propertiesResult.error) throw propertiesResult.error;
        if (servicesResult.error) throw servicesResult.error;

        // Clean up any usage
        const propertyItems = (propertiesResult.data || []) as PropertyDB[];
        const serviceItems = (servicesResult.data || []) as ServiceDB[];

        const propertyMap = new Map(propertyItems.map(p => [p.id, p]));
        const serviceMap = new Map(serviceItems.map(s => [s.id, s]));

        // 3. Map details back to bookings
        const enrichedBookings = bookings.map(booking => {
            let details = {};
            if (booking.item_type === 'property') {
                details = { property: propertyMap.get(booking.item_id) || null };
            } else if (booking.item_type === 'service') {
                details = { service: serviceMap.get(booking.item_id) || null };
            }
            return { ...booking, ...details };
        });

        return enrichedBookings as EnrichedBooking[];
    },
    
    // Admin Bookings
    async getAdminBookings(statusFilter?: string): Promise<EnrichedBooking[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.user_metadata?.role !== 'admin') {
            throw new Error('Not authorized');
        }

        let query = supabase.from('bookings').select('*');

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data: bookings, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (!bookings || bookings.length === 0) return [];

        // Batch Fetching for Efficient Data Loading (Avoid N+1 Problem)
        const userIds = Array.from(new Set(bookings.map(b => b.user_id).filter(Boolean)));
        const propertyIds = Array.from(new Set(bookings.filter(b => b.item_type === 'property').map(b => b.item_id).filter(Boolean)));
        const serviceIds = Array.from(new Set(bookings.filter(b => b.item_type === 'service').map(b => b.item_id).filter(Boolean)));

        const [usersResult, propertiesResult, servicesResult] = await Promise.all([
            userIds.length > 0 
                ? supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', userIds)
                : Promise.resolve({ data: [] as any[] }),
            propertyIds.length > 0 
                ? supabase.from('properties').select('id, title, images, price_per_night, location').in('id', propertyIds)
                : Promise.resolve({ data: [] as any[] }),
            serviceIds.length > 0
                ? supabase.from('services').select('id, title, images, price, type').in('id', serviceIds)
                : Promise.resolve({ data: [] as any[] })
        ]);

        const userMap = new Map(((usersResult.data || []) as UserProfile[]).map(u => [u.id, u]));
        const propertyMap = new Map(((propertiesResult.data || []) as PropertyDB[]).map(p => [p.id, p]));
        const serviceMap = new Map(((servicesResult.data || []) as ServiceDB[]).map(s => [s.id, s]));

        const enrichedBookings = bookings.map(booking => {
            const user = userMap.get(booking.user_id);
            
            let itemDetails = {};
            if (booking.item_type === 'property') {
                const property = propertyMap.get(booking.item_id);
                itemDetails = { property, itemTitle: property?.title };
            } else if (booking.item_type === 'service') {
                const service = serviceMap.get(booking.item_id);
                itemDetails = { service, itemTitle: service?.title };
            }

            return { ...booking, user, ...itemDetails };
        });

        return enrichedBookings as EnrichedBooking[];
    },

    async getBookingsByStatus(status: string) {
        return this.getAdminBookings(status);
    },

    // Host Bookings (New Efficient Method)
    async getBookingsForHost(hostId: string, dateFrom?: string, dateTo?: string): Promise<EnrichedBooking[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || (user.id !== hostId && user.user_metadata?.role !== 'admin')) {
            throw new Error('Not authorized');
        }
        const { data: properties } = await supabase
            .from('properties')
            .select('id, title, images, location')
            .eq('host_id', hostId);

        if (!properties || properties.length === 0) return [];

        const propertyIds = properties.map(p => p.id);
        const propertyMap = new Map(properties.map(p => [p.id, p]));

        // 2. Get bookings for these properties
        let query = supabase
            .from('bookings')
            .select('*')
            .in('item_id', propertyIds)
            .eq('item_type', 'property') // Only property bookings for now
            .eq('status', 'confirmed')
            .order('check_in', { ascending: true }); // Upcoming first

        // Filter by date range if provided
        if (dateFrom) query = query.gte('check_out', dateFrom);
        if (dateTo) query = query.lte('check_in', dateTo);

        const { data: bookings, error } = await query;

        if (error) throw error;
        if (!bookings) return [];

        // 3. Batch Fetch Guest Info (Fix N+1 query)
        const guestIds = Array.from(new Set(bookings.map(b => b.user_id).filter(Boolean)));
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, phone')
            .in('id', guestIds);
        
        const profileMap = new Map(((profiles || []) as UserProfile[]).map(p => [p.id, p]));

        const enrichedBookings = bookings.map(booking => ({
            ...booking,
            user: profileMap.get(booking.user_id), // Guest details
            property: propertyMap.get(booking.item_id),
            itemTitle: propertyMap.get(booking.item_id)?.title
        }));

        return enrichedBookings as EnrichedBooking[];
    },

    async updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'pending' | 'completed', reason?: string) {
        
        // 1. Fetch current status to determine email type (Reject vs Cancel)
        const { data: currentBooking } = await supabase
            .from('bookings')
            .select('status, user_id, check_in, check_out, property:properties(title, host_id), service:services(title, provider_id)')
            .eq('id', id)
            .single();

         const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;

        // Audit log for status change
        if (currentBooking) {
            if (status === 'confirmed') {
                createAuditLog('BOOKING_CONFIRMED', { bookingId: id }, currentBooking.user_id);
            } else if (status === 'cancelled') {
                const eventType = currentBooking.status === 'pending'
                    ? 'BOOKING_REJECTED'
                    : 'BOOKING_CANCELLED';
                createAuditLog(eventType, { bookingId: id, reason }, currentBooking.user_id);
            }
        }

        // Trigger Email Notification
        if (status === 'confirmed' || status === 'cancelled') {
             
            if (currentBooking) {
                let type: string | null = null;
                
                // Supabase join often returns array, handle both cases safely
                const property = Array.isArray(currentBooking.property) ? currentBooking.property[0] : currentBooking.property;
                const service = Array.isArray(currentBooking.service) ? currentBooking.service[0] : currentBooking.service;
                
                const itemTitle = (property as any)?.title || (service as any)?.title || 'Item';
                const hostId = (property as any)?.host_id || (service as any)?.provider_id;
                const itemTypeLabel = property ? 'Property' : (service ? 'Service' : 'Item');

                if (status === 'confirmed') {
                    type = 'booking_confirmed';
                } else if (status === 'cancelled') {
                    // Distinguish Reject vs Cancel
                    if (currentBooking.status === 'pending') {
                        type = 'booking_rejected';
                    } else {
                        type = 'booking_cancelled';
                    }
                }
                
                if (type) {
                     // Notify Guest
                     retry(() => supabase.functions.invoke('send-email', {
                        body: {
                            type,
                            userId: currentBooking.user_id,
                            data: {
                                itemTitle: itemTitle,
                                itemTypeLabel: itemTypeLabel,
                                checkIn: currentBooking.check_in,
                                checkOut: currentBooking.check_out,
                                reason: reason, // For rejection
                                link: getAppUrl('/profile')
                            }
                        }
                    })).catch(err => console.error('Failed to send status email:', err));

                    // Notify Host if Cancelled
                    if (status === 'cancelled' && type === 'booking_cancelled' && hostId) {
                        retry(() => supabase.functions.invoke('send-email', {
                            body: {
                                type: 'booking_cancelled_host',
                                userId: hostId,
                                data: {
                                    guestName: 'Guest', 
                                    itemTitle: itemTitle,
                                    itemTypeLabel: itemTypeLabel,
                                    checkIn: currentBooking.check_in,
                                    checkOut: currentBooking.check_out,
                                    link: getAppUrl('/host/bookings')
                                }
                            }
                        })).catch(err => console.error('Failed to send host cancellation email:', err));
                    }
                }
            }
        }
    },

    async cancelBooking(id: string) {
        // 1. Fetch booking to check created_at time
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('created_at, status, user_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;
        if (!booking) throw new Error('Booking not found');

        // 2. Check 48-hour window
        const createdAt = new Date(booking.created_at).getTime();
        const now = Date.now();
        const diffHours = (now - createdAt) / (1000 * 60 * 60);

        // 3. Update status
        // Note: In a real system, if diffHours > 48, we might apply a fee/reduce refund.
        // For this MVP, we just mark it as cancelled, but we could add a 'cancellation_reason' or similar.
        // The policy says "Free cancellation for 48 hours", implying logic typically changes afterwards.
        // We will proceed with cancellation but log/notify based on time.
        
        let reason = 'User requested cancellation';
        if (diffHours <= 48) {
             reason = 'Free Cancellation (within 48h)';
        } else {
             reason = 'Standard Cancellation (after 48h)';
             // potentially trigger partial refund logic here in future
        }

        // Log cancellation for audit tracking
        createAuditLog('CANCELLATION', { 
            bookingId: id, 
            reason,
            hoursSinceCreation: diffHours.toFixed(2)
        }, booking.user_id);

        return this.updateBookingStatus(id, 'cancelled', reason);
    }
};
