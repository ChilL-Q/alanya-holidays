import { supabase } from './supabase';
import { User } from '../context/AuthContext';

// Types matched to Database Schema
export interface PropertyData {
    title: string;
    description: string;
    price_per_night: number;
    location: string;
    address: string;
    type: 'villa' | 'apartment';
    amenities: any;
    images: string[];
    host_id: string;
    rental_license?: string;
    // Hospitality Details
    arrival_guide?: string;
    check_in_time?: string;
    check_out_time?: string;
    directions?: string;
    check_in_method?: string;
    wifi_details?: string;
    house_manual?: string;
    house_rules?: string;
    checkout_instructions?: string;
    guidebooks?: string;
    interaction_preferences?: string;
    max_guests?: number;
    beds?: number;
}

export interface ServiceData {
    title: string;
    description: string;
    price: number;
    type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer';
    provider_id: string;
    features: any;
    images: string[];
}

export interface ProductData {
    title: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    artisan_id: string;
    images: string[];
}

export const db = {
    // --- Storage ---
    async uploadPropertyImage(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('properties')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
        return data.publicUrl;
    },

    async uploadAvatar(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) {
            // If avatars bucket fails, try properties as fallback
            const { error: secondTryError } = await supabase.storage
                .from('properties')
                .upload(filePath, file);

            if (secondTryError) throw uploadError;

            const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
            return data.publicUrl;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    },

    // --- Properties ---
    async createProperty(data: PropertyData) {
        const { data: property, error } = await supabase
            .from('properties')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return property;
    },

    async getProperties() {
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getProperty(id: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // --- Services ---
    async createService(data: ServiceData) {
        const { data: service, error } = await supabase
            .from('services')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return service;
    },

    async getServices(type?: string) {
        let query = supabase.from('services').select('*, provider:profiles(full_name)');

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // --- Products (Artisan Shop) ---
    async createProduct(data: ProductData) {
        const { data: product, error } = await supabase
            .from('products')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return product;
    },

    async getProducts(category?: string) {
        let query = supabase.from('products').select('*, artisan:profiles(full_name)');

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // --- Storage (Placeholder) ---
    async uploadImage(file: File, bucket: 'properties' | 'services' | 'products' = 'properties') {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Note: You must create 'properties' and 'services' buckets in Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    },

    // --- Bookings ---
    async createBooking(data: BookingData) {
        // Map frontend 'type' to DB 'item_type'
        const dbData: any = { ...data };
        dbData.item_type = data.type;
        delete dbData.type;

        const { data: booking, error } = await supabase
            .from('bookings')
            .insert([dbData])
            .select()
            .single();

        if (error) throw error;
        return booking;
    },

    async getBookings(userId?: string) {
        // 1. Fetch raw bookings
        let query = supabase.from('bookings').select('*');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: bookings, error } = await query.order('check_in', { ascending: true });

        if (error) throw error;
        if (!bookings) return [];

        // 2. Enrich with details manually (Polymorphic join workaround)
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            let details = null;
            if (booking.item_type === 'property') {
                const { data } = await supabase.from('properties').select('title, images, price_per_night, location').eq('id', booking.item_id).single();
                details = { property: data };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title, images, price, type').eq('id', booking.item_id).single();
                details = { service: data };
            }
            // Add products similarly if needed
            return { ...booking, ...details };
        }));

        return enrichedBookings;
    },

    // --- Messages (Contact) ---
    async sendMessage(data: MessageData) {
        const { error } = await supabase
            .from('messages')
            .insert([data]);

        if (error) throw error;
        return true;
    },

    // --- Favorites ---
    async toggleFavorite(data: { user_id: string; item_id: string }) {
        // Check if exists
        const { data: existing } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', data.user_id)
            .eq('item_id', data.item_id)
            .single();

        if (existing) {
            await supabase.from('favorites').delete().eq('id', existing.id);
            return false; // Removed
        } else {
            await supabase.from('favorites').insert([data]);
            return true; // Added
        }
    },

    async getFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('item_id') // We only need IDs to filter/check
            .eq('user_id', userId);

        if (error) throw error;
        return data.map(f => f.item_id);
    },

    // --- Admin ---
    async getAdminProperties(statusFilter?: string) {
        let query = supabase.from('properties').select('*');
        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }
        // If 'all', no filter
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async updateProperty(id: string, updates: Partial<PropertyData>) {
        const { error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteUser(id: string) {
        // Note: This only deletes the 'profile'. Ideally should delete auth.user via Edge Function.
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updatePropertyStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
        const { error } = await supabase
            .from('properties')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    async deleteProperty(id: string) {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },



    async getAllUsers() { // For User Manager
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async getUserProfile(id: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    },

    async updateUserProfile(id: string, updates: any) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async updateUserRole(id: string, role: 'host' | 'guest' | 'admin') {
        return this.updateUserProfile(id, { role });
    },

    async getAdminBookings() {
        // Fetch all bookings with User details
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*, user:profiles(full_name, email, avatar_url)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!bookings) return [];

        // Enrich with Item details (Property/Service)
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            let details = null;
            if (booking.item_type === 'property') {
                const { data } = await supabase.from('properties').select('title').eq('id', booking.item_id).single();
                details = { itemTitle: data?.title || 'Unknown Property', itemType: 'Property' };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title').eq('id', booking.item_id).single();
                details = { itemTitle: data?.title || 'Unknown Service', itemType: 'Service' };
            }
            return { ...booking, ...details };
        }));

        return enrichedBookings;
    },

    async updateBookingStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed') {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    }
};

export interface BookingData {
    user_id: string;
    item_id: string; // Property ID or Service ID
    type: 'property' | 'service';
    status: 'pending' | 'confirmed' | 'cancelled';
    check_in: string; // ISO Date
    check_out?: string; // ISO Date (optional for single day services)
    total_price: number;
    guests?: number;
}

export interface MessageData {
    name: string;
    email: string;
    subject: string;
    message: string;
}
