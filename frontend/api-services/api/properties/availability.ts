import { supabase } from '../../supabase';
import { getUserRole } from '../../auth';
import { PropertyAvailability } from '../../../types/index';

export async function getPropertyAvailability(propertyId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
        .from('property_availability')
        .select('*, feed:property_ical_feeds(name)')
        .eq('property_id', propertyId)
        .gte('date', startDate)
        .lte('date', endDate);
    if (error) throw error;
    return data as PropertyAvailability[];
}

export async function updatePropertyAvailability(
    propertyId: string,
    dates: string[],
    status: 'available' | 'booked' | 'blocked',
    price?: number
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: prop } = await supabase
        .from('properties')
        .select('host_id')
        .eq('id', propertyId)
        .single();

    const role = await getUserRole(user.id);
    if (!prop || (prop.host_id !== user.id && role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { error: deleteError } = await supabase
        .from('property_availability')
        .delete()
        .eq('property_id', propertyId)
        .in('date', dates);

    if (deleteError) throw deleteError;
    if (status === 'available' && !price) return;

    const entries = dates.map(date => ({ property_id: propertyId, date, status, price, source: 'manual' }));
    const { error: insertError } = await supabase.from('property_availability').insert(entries);
    if (insertError) throw insertError;
}

export async function syncPropertyCalendar(propertyId: string) {
    const { data, error } = await supabase.functions.invoke('sync-ical', { body: { propertyId } });
    if (error) throw error;
    return data;
}

export async function getUnavailableDates(propertyId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
        .from('property_availability')
        .select('date')
        .eq('property_id', propertyId)
        .gte('date', today)
        .neq('status', 'available');
    if (error) throw error;
    return (data || []).map(row => row.date);
}
