import { supabase } from '../supabase';
import { PropertyDB, ApprovalStatus, Review } from '../../types/index';
import { NotificationType } from '../../types/enums';
import { notificationsService } from './notifications';

export const propertiesService = {
    async getPropertiesByIds(ids: string[]) {
        if (!ids.length) return [];
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .in('id', ids);
        
        if (error) throw error;
        return data as PropertyDB[];
    },

    async createProperty(data: Omit<PropertyDB, 'id' | 'created_at' | 'updated_at'>) {
        const { data: property, error } = await supabase
            .from('properties')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return property as PropertyDB;
    },

    async getProperties(page = 1, limit = 20) {
        // Optimized: removed * and selected specific fields if needed
        let query = supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)', { count: 'exact' });

        query = query.eq('status', 'approved');

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data as PropertyDB[], count };
    },

    async getProperty(id: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as PropertyDB;
    },

    async getPropertiesByHost(hostId: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('host_id', hostId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as PropertyDB[];
    },

    async getAdminProperties(statusFilter?: string, page = 1, limit = 50) {
        let query = supabase.from('properties').select('*', { count: 'exact' });
        
        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data as PropertyDB[], count };
    },


    async updateProperty(id: string, updates: Partial<PropertyDB>) {
        const { error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Notify Host (if it's an admin update, typically)
        // We need to fetch property to know host_id and title
         const { data: property } = await supabase.from('properties').select('host_id, title, type').eq('id', id).single();
         if (property && updates.status === undefined) { 
             // Only notify on general updates if needed, or we can restricting this to specific fields
             // The original db.ts notified on ANY update.
             const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
             await notificationsService.createNotification(
                 property.host_id,
                 'Property Updated',
                 `Your ${typeLabel} "${property.title}" has been updated by an administrator.`,
                 'info'
             );
         }
    },

    async updatePropertyStatus(id: string, status: ApprovalStatus | 'approved' | 'rejected' | 'pending', reason?: string) {
        const updates: any = { status };
        if (status === 'rejected' && reason) updates.rejection_reason = reason;
        if (status === 'approved') updates.rejection_reason = null;

        const { error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id);
        if (error) throw error;

        // Notify Host
        if (status !== 'pending') {
            const { data: property } = await supabase.from('properties').select('host_id, title, type').eq('id', id).single();
            if (property) {
                const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
                const title = status === 'approved' ? 'Property Approved' : 'Property Rejected';
                const message = status === 'approved'
                    ? `Congratulations! Your ${typeLabel} "${property.title}" has been approved and is now listed.`
                    : `Your ${typeLabel} "${property.title}" was rejected. Reason: ${reason || 'No reason provided'}`;

                await notificationsService.createNotification(
                    property.host_id,
                    title,
                    message,
                    status === 'approved' ? 'success' : 'error'
                );
            }
        }
    },

    async approveProperty(id: string) {
        return this.updatePropertyStatus(id, 'approved');
    },

    async getReviews(propertyId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Review[];
    },

    async addReview(review: Omit<Review, 'id' | 'created_at'>) {
        const { error } = await supabase
            .from('reviews')
            .insert([review]);
        if (error) throw error;
    },

    async deleteProperty(id: string) {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
    
    // Extracted lookups
    async getPropertyTypes() {
        const { data, error } = await supabase
            .from('properties')
            .select('type');
        if (error) throw error;
        return [...new Set(data.map((p: any) => p.type))];
    },

    async getPropertyLocations(type: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('location')
            .eq('type', type);
        if (error) throw error;
        return [...new Set(data.map((p: any) => p.location))];
    },

    async getPropertiesByLocation(type: string, location: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .eq('type', type)
            .eq('location', location)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as PropertyDB[];
    },
};
