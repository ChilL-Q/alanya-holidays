import { supabase } from '../supabase';
import { UserProfile } from '../../types/index';

export const usersService = {
    async getAllUsers() { // For User Manager
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
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async getUsersByRole(role: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as UserProfile[];
    }
};
