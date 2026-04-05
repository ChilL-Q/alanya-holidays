import { supabase } from '../../supabase';
import { PropertyICalFeed } from '../../../types/index';

export async function getICalFeeds(propertyId: string) {
    const { data, error } = await supabase
        .from('property_ical_feeds')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data as PropertyICalFeed[];
}

export async function addICalFeed(propertyId: string, name: string, url: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: prop } = await supabase
        .from('properties')
        .select('host_id')
        .eq('id', propertyId)
        .single();

    if (!prop || (prop.host_id !== user.id && user.user_metadata?.role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { data, error } = await supabase
        .from('property_ical_feeds')
        .insert([{ property_id: propertyId, name, url }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeICalFeed(id: string) {
    const { error } = await supabase.from('property_ical_feeds').delete().eq('id', id);
    if (error) throw error;
}
