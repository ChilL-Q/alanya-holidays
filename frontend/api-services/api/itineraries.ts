import { supabase } from '../supabase';
import { SavedItinerary, TripParams, ItineraryDay } from '../../types/models';

export const itinerariesService = {
    async saveItinerary(
        title: string,
        params: TripParams,
        itinerary: ItineraryDay[]
    ): Promise<SavedItinerary> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('saved_itineraries')
            .insert({ user_id: user.id, title, params, itinerary })
            .select()
            .single();

        if (error) throw error;
        return data as SavedItinerary;
    },

    async getMyItineraries(): Promise<SavedItinerary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('saved_itineraries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return (data || []) as SavedItinerary[];
    },

    async getItinerary(id: string): Promise<SavedItinerary | null> {
        const { data, error } = await supabase
            .from('saved_itineraries')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data as SavedItinerary | null;
    },

    async deleteItinerary(id: string): Promise<void> {
        const { error } = await supabase
            .from('saved_itineraries')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};
