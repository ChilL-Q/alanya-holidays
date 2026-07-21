
import { supabase } from './supabase';

export async function getUserRole(userId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
    
    return data?.role;
}

export async function isAdmin(userId: string) {
    const role = await getUserRole(userId);
    return role === 'admin';
}
