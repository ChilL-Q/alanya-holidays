import { supabase } from '../supabase';
import { createBooking } from './bookings/mutations';

export interface ConsultantProfile {
    id: string;
    user_id: string;
    bio: string | null;
    specialties: string[];
    languages: string[];
    hourly_rate: number;
    is_available: boolean;
    avatar_url: string | null;
    created_at: string;
    profile: {
        full_name: string;
        avatar_url: string | null;
    } | null;
}

export interface ConsultantFilters {
    language?: string;
    specialty?: string;
    isAvailable?: boolean;
}

export const consultantsService = {
    async getConsultants(filters: ConsultantFilters = {}): Promise<ConsultantProfile[]> {
        let query = supabase
            .from('consultant_profiles')
            .select(`
                *,
                profile:profiles!consultant_profiles_user_id_fkey(full_name, avatar_url)
            `)
            .order('is_available', { ascending: false })
            .order('hourly_rate', { ascending: true });

        if (filters.isAvailable !== undefined) {
            query = query.eq('is_available', filters.isAvailable);
        }
        if (filters.language) {
            query = query.contains('languages', [filters.language]);
        }
        if (filters.specialty) {
            query = query.contains('specialties', [filters.specialty]);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as ConsultantProfile[];
    },

    async bookConsultant(
        consultantId: string,
        hourlyRate: number,
        dateTime: string,
        durationHours: number,
        message?: string
    ): Promise<{ id: string }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const checkIn = new Date(dateTime);
        const checkOut = new Date(checkIn.getTime() + durationHours * 60 * 60 * 1000);

        return createBooking({
            item_id: consultantId,
            user_id: user.id,
            item_type: 'consultant',
            check_in: checkIn.toISOString(),
            check_out: checkOut.toISOString(),
            guests: 1,
            total_price: hourlyRate * durationHours,
            message: message,
        });
    },
};
