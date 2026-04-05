import { supabase } from '../../supabase';
import { PropertyDB } from '../../../types/index';

export async function getPropertyTypes() {
    const { data, error } = await supabase.from('properties').select('type');
    if (error) throw error;
    return [...new Set(data.map((p: any) => p.type))];
}

export async function getPropertyLocations(type: string) {
    const { data, error } = await supabase
        .from('properties')
        .select('location')
        .eq('type', type);
    if (error) throw error;
    return [...new Set(data.map((p: any) => p.location))];
}

export async function getPropertiesByLocation(type: string, location: string, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
        .from('properties')
        .select('*, host:profiles(full_name, avatar_url)', { count: 'exact' })
        .eq('type', type)
        .eq('location', location)
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + limit - 1);

    if (error) throw error;
    return { data: data as PropertyDB[], count };
}
