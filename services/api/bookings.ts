import { supabase } from '../supabase';
import { Booking } from '../../types/index';

export const bookingsService = {
    async createBooking(data: any) {
        // Fallback or Legacy: use RPC if possible for safety
        // We will switch to using the safe version as primary
        
        // Clean data for RPC
        const rpcParams = {
            p_property_id: data.item_id || data.id, // handle both just in case
            p_user_id: data.user_id,
            p_check_in: data.check_in,
            p_check_out: data.check_out,
            p_total_price: data.total_price,
            p_guests: data.guests,
            p_message: data.message,
            p_payment_method: data.payment_method || 'card'
        };

        const { data: result, error } = await supabase.rpc('create_booking', rpcParams);

        if (error) throw error;
        if (result.error) throw new Error(result.error);
        
        return { id: result.data };
    },
    
    // Original unsafe method kept as reference if needed (renamed internal or just removed)
    // async createBookingLegacy(data: any) { ... }

    async getBookings(userId?: string) {
        // 1. Fetch raw bookings
        let query = supabase.from('bookings').select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: bookings, error } = await query.order('check_in', { ascending: true });

        if (error) throw error;
        if (!bookings || bookings.length === 0) return [];

        // 2. Batch Fetching Details
        const propertyIds = bookings
            .filter((b: any) => b.item_type === 'property')
            .map((b: any) => b.item_id);
            
        const serviceIds = bookings
            .filter((b: any) => b.item_type === 'service')
            .map((b: any) => b.item_id);

        const [propertiesResult, servicesResult] = await Promise.all([
            propertyIds.length > 0 
                ? supabase.from('properties').select('id, title, images, price_per_night, location').in('id', propertyIds)
                : Promise.resolve({ data: [], error: null }),
            serviceIds.length > 0
                ? supabase.from('services').select('id, title, images, price, type').in('id', serviceIds)
                : Promise.resolve({ data: [], error: null })
        ]);

        if (propertiesResult.error) throw propertiesResult.error;
        if (servicesResult.error) throw servicesResult.error;

        // Clean up any usage
        const propertyItems = propertiesResult.data || [];
        const serviceItems = servicesResult.data || [];

        const propertyMap = new Map(propertyItems.map((p: any) => [p.id, p] as [string, any]));
        const serviceMap = new Map(serviceItems.map((s: any) => [s.id, s] as [string, any]));

        // 3. Map details back to bookings
        const enrichedBookings = bookings.map((booking: any) => {
            let details = null;
            if (booking.item_type === 'property') {
                details = { property: propertyMap.get(booking.item_id) || null };
            } else if (booking.item_type === 'service') {
                details = { service: serviceMap.get(booking.item_id) || null };
            }
            return { ...booking, ...details };
        });

        return enrichedBookings as Booking[];
    },
    
    // Admin Bookings
    async getAdminBookings(statusFilter?: string) {
        let query = supabase.from('bookings').select('*');

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data: bookings, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        if (!bookings) return [];

        // Manual Join for Users, Properties, Services
        // This is more reliable than depending on Supabase relations if they aren't perfect
        const enrichedBookings = await Promise.all(bookings.map(async (booking: any) => {
            // User
            const { data: user } = await supabase.from('profiles').select('full_name, email, avatar_url').eq('id', booking.user_id).maybeSingle();
            
            // Item
            let itemDetails = null;
            if (booking.item_type === 'property') {
                const { data } = await supabase.from('properties').select('title, images, price_per_night, location').eq('id', booking.item_id).maybeSingle();
                itemDetails = { property: data, itemTitle: data?.title };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title, images, price, type').eq('id', booking.item_id).maybeSingle();
                itemDetails = { service: data, itemTitle: data?.title };
            }

            return { ...booking, user, ...itemDetails };
        }));

        return enrichedBookings;
    },

    async getBookingsByStatus(status: string) {
        return this.getAdminBookings(status);
    },

    // Host Bookings (New Efficient Method)
    async getBookingsForHost(hostId: string) {
        // 1. Get all properties owned by host
        const { data: properties } = await supabase
            .from('properties')
            .select('id, title, images, location')
            .eq('host_id', hostId);

        if (!properties || properties.length === 0) return [];

        const propertyIds = properties.map(p => p.id);
        const propertyMap = new Map(properties.map(p => [p.id, p]));

        // 2. Get bookings for these properties
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .in('item_id', propertyIds)
            .eq('item_type', 'property') // Only property bookings for now
            .order('check_in', { ascending: true }); // Upcoming first

        if (error) throw error;

        // 3. Enrich with Guest Info
        const enrichedBookings = await Promise.all(bookings.map(async (booking: any) => {
            const { data: user } = await supabase
                .from('profiles')
                .select('full_name, email, avatar_url, phone') // Host needs phone potentially
                .eq('id', booking.user_id)
                .maybeSingle();

            return {
                ...booking,
                user, // Guest details
                property: propertyMap.get(booking.item_id),
                itemTitle: propertyMap.get(booking.item_id)?.title
            };
        }));

        return enrichedBookings;
    },

    async updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'pending' | 'completed') {
         const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }
};
