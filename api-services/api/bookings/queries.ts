import { supabase } from '../../supabase';
import { Booking, PropertyDB, ServiceDB, UserProfile } from '../../../types/index';
import type { EnrichedBooking } from './index';

export async function getBookings(userId: string): Promise<EnrichedBooking[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    if (user.id !== userId && user.user_metadata?.role !== 'admin') {
        throw new Error('Not authorized');
    }

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('check_in', { ascending: true });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    const propertyIds = bookings.filter(b => b.item_type === 'property').map(b => b.item_id);
    const serviceIds  = bookings.filter(b => b.item_type === 'service').map(b => b.item_id);

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

    const propertyMap = new Map((propertiesResult.data as PropertyDB[]).map(p => [p.id, p]));
    const serviceMap  = new Map((servicesResult.data as ServiceDB[]).map(s => [s.id, s]));

    return bookings.map(booking => {
        let details = {};
        if (booking.item_type === 'property') {
            details = { property: propertyMap.get(booking.item_id) || null };
        } else if (booking.item_type === 'service') {
            details = { service: serviceMap.get(booking.item_id) || null };
        }
        return { ...booking, ...details };
    }) as EnrichedBooking[];
}

export async function getAdminBookings(statusFilter?: string): Promise<EnrichedBooking[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') throw new Error('Not authorized');

    let query = supabase.from('bookings').select('*');
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data: bookings, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    const userIds      = Array.from(new Set(bookings.map(b => b.user_id).filter(Boolean)));
    const propertyIds  = Array.from(new Set(bookings.filter(b => b.item_type === 'property').map(b => b.item_id).filter(Boolean)));
    const serviceIds   = Array.from(new Set(bookings.filter(b => b.item_type === 'service').map(b => b.item_id).filter(Boolean)));

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

    const userMap     = new Map((usersResult.data as UserProfile[]).map(u => [u.id, u]));
    const propertyMap = new Map((propertiesResult.data as PropertyDB[]).map(p => [p.id, p]));
    const serviceMap  = new Map((servicesResult.data as ServiceDB[]).map(s => [s.id, s]));

    return bookings.map(booking => {
        const enrichedUser = userMap.get(booking.user_id);
        let itemDetails = {};
        if (booking.item_type === 'property') {
            const property = propertyMap.get(booking.item_id);
            itemDetails = { property, itemTitle: (property as any)?.title };
        } else if (booking.item_type === 'service') {
            const service = serviceMap.get(booking.item_id);
            itemDetails = { service, itemTitle: (service as any)?.title };
        }
        return { ...booking, user: enrichedUser, ...itemDetails };
    }) as EnrichedBooking[];
}

export async function getBookingsForHost(hostId: string, dateFrom?: string, dateTo?: string): Promise<EnrichedBooking[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || (user.id !== hostId && user.user_metadata?.role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { data: properties } = await supabase
        .from('properties')
        .select('id, title, images, location')
        .eq('host_id', hostId);

    if (!properties || properties.length === 0) return [];

    const propertyIds  = properties.map(p => p.id);
    const propertyMap  = new Map(properties.map(p => [p.id, p]));

    let query = supabase
        .from('bookings')
        .select('*')
        .in('item_id', propertyIds)
        .eq('item_type', 'property')
        .eq('status', 'confirmed')
        .order('check_in', { ascending: true });

    if (dateFrom) query = query.gte('check_out', dateFrom);
    if (dateTo)   query = query.lte('check_in', dateTo);

    const { data: bookings, error } = await query;
    if (error) throw error;
    if (!bookings) return [];

    const guestIds = Array.from(new Set(bookings.map(b => b.user_id).filter(Boolean)));
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone')
        .in('id', guestIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return bookings.map(booking => ({
        ...booking,
        user:      profileMap.get(booking.user_id),
        property:  propertyMap.get(booking.item_id),
        itemTitle: (propertyMap.get(booking.item_id) as any)?.title
    })) as EnrichedBooking[];
}
