import { supabase } from '../supabase';
import { LocationDB } from '../../types/models';

export const locationsService = {
    async getLocations(): Promise<LocationDB[]> {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Failed to fetch locations:', error.message);
            throw new Error('Failed to fetch locations');
        }

        return data || [];
    },

    async getLocationsByRegion(region: 'Antalya City' | 'Alanya' | 'Other'): Promise<LocationDB[]> {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('is_active', true)
            .eq('parent_region', region)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Failed to fetch locations by region:', error.message);
            throw new Error('Failed to fetch locations');
        }

        return data || [];
    }
};
