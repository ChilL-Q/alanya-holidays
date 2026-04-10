import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { UserProfile } from '../../types/index';

export const usersService = {
    async getAllUsers(page: number = 1, limit: number = 20) { // For User Manager
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const role = await getUserRole(session.user.id);
        if (role !== 'admin') {
            throw new Error('Not authorized');
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error) throw error;
        return {
            data: data as UserProfile[],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        };
    },

    async getUserProfile(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data as UserProfile;
    },

    async updateUserProfile(id: string, updates: Partial<UserProfile>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);

        // Only allow users to update their own profile, admins can update anyone
        if (user.id !== id && role !== 'admin') {
            throw new Error('Not authorized');
        }

        // Strip sensitive fields from non-admin updates
        const safeUpdates = { ...updates };
        if (role !== 'admin') {
            delete safeUpdates.role;
        }

        const { error } = await supabase
            .from('profiles')
            .update(safeUpdates)
            .eq('id', id);
        if (error) throw error;
    },

    async getUsersByRole(role: string, page: number = 1, limit: number = 20) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const userRole = await getUserRole(session.user.id);
        if (userRole !== 'admin') {
            throw new Error('Not authorized');
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('role', role)
            .order('created_at', { ascending: false })
            .range(from, to);
        if (error) throw error;
        return {
            data: data as UserProfile[],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        };
    }
};
