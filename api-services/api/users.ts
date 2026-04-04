import { supabase } from '../supabase';
import { UserProfile } from '../../types/index';

export const usersService = {
    async getAllUsers() { // For User Manager
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.user_metadata?.role !== 'admin') {
            throw new Error('Not authorized');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as UserProfile[];
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

        // Only allow users to update their own profile, admins can update anyone
        if (user.id !== id && user.user_metadata?.role !== 'admin') {
            throw new Error('Not authorized');
        }

        // Strip sensitive fields from non-admin updates
        const safeUpdates = { ...updates };
        if (user.user_metadata?.role !== 'admin') {
            delete safeUpdates.role;
        }

        const { error } = await supabase
            .from('profiles')
            .update(safeUpdates)
            .eq('id', id);
        if (error) throw error;
    },

    async getUsersByRole(role: string) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.user_metadata?.role !== 'admin') {
            throw new Error('Not authorized');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as UserProfile[];
    }
};
