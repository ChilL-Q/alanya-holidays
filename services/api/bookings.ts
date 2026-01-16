import { supabase } from '../supabase';
import { Booking } from '../../types/index';

export const bookingsService = {
    async createBooking(data: any) { // Keep explicit type if possible, simpler for now
        // Map frontend 'type' to DB 'item_type'
        const dbData: any = { ...data };
        dbData.item_type = data.type;
        delete dbData.type;

        const { data: booking, error } = await supabase
            .from('bookings')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return booking;
    },

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
         let query = supabase.from('bookings').select('*, user:profiles(full_name, email)');
         // Note: user:profiles might not work if relation isn't set up. But usually it is on user_id.

        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data: bookings, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        
         // Enrich admin bookings too? 
         // Original db.ts didn't have specific getAdminBookings logic different from getBookings except for `getAdminBookings` in 555cfe conversation snippet but not in the viewed file.
         // Limit to what I saw in db.ts or standard logic.
         // Ref: "Modify relevant database queries in services/db.ts ... to use .maybeSingle()"
         // I'll stick to a generic approach or reuse getBookings logic if possible, but admin needs *all* users.
         
         const enrichedBookings = await Promise.all(bookings.map(async (booking: any) => {
            let details = null;
            if (booking.item_type === 'property') {
                const { data } = await supabase.from('properties').select('title').eq('id', booking.item_id).maybeSingle();
                details = { property: data };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title, type').eq('id', booking.item_id).maybeSingle();
                details = { service: data };
            }
            return { ...booking, ...details };
        }));
        
        return enrichedBookings;
    },

    async getBookingsByStatus(status: string) {
        return this.getAdminBookings(status);
    },

    async updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'pending' | 'completed') {
         const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }
};
