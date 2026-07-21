import { supabase } from '../../supabase';
import { getUserRole } from '../../auth';
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

    const role = await getUserRole(user.id);
    if (!prop || (prop.host_id !== user.id && role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { data, error } = await supabase
        .from('property_ical_feeds')
        .insert([{ property_id: propertyId, name, url }])
        .select()
        .single();

    if (error) throw error;
    return data as PropertyICalFeed;
}

export async function syncPropertyICal(propertyId: string) {
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

    const { data, error } = await supabase
        .from('property_ical_feeds')
        .select('*')
        .eq('property_id', propertyId);

    if (error) throw error;
    if (!data || data.length === 0) return;

    const feeds = data as PropertyICalFeed[];
    const results = await Promise.all(feeds.map(async (feed) => {
        try {
            const { data: result, error: rpcError } = await supabase.rpc('sync_ical_feed', { feed_id: feed.id });
            if (rpcError) throw rpcError;
            return { feedId: feed.id, success: true, count: result };
        } catch (e) {
            console.error(`Failed to sync feed ${feed.id}:`, e);
            return { feedId: feed.id, success: false, error: e };
        }
    }));

    return results;
}

export async function removeICalFeed(id: string) {
    const { error } = await supabase.from('property_ical_feeds').delete().eq('id', id);
    if (error) throw error;
}
