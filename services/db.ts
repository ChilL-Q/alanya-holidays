import { supabase } from './supabase';
import { User } from '../context/AuthContext';

export interface Amenity {
    icon: string;
    label: string;
}

// Types matched to Database Schema
export interface PropertyData {
    id?: string;
    title: string;
    description: string;
    price_per_night: number;
    location: string;
    address: string;
    latitude?: number;
    longitude?: number;
    type: 'villa' | 'apartment';
    amenities: Amenity[] | any[];
    images: string[];
    host_id: string;
    ical_url?: string;
    rental_license?: string;
    status?: 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
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
    bathrooms: number;
    bedrooms: number;
    rating?: number;
    reviews_count?: number;
    host?: {
        full_name: string;
        avatar_url?: string;
    };
    [key: string]: any;
}

export interface ServiceFeatures {
    [key: string]: any; // Allow flexibility but encourage typed usage where possible
    brand?: string;
    model?: string;
    year?: string;
    transmission?: string;
    fuel?: string;
    seats?: number;
}

export interface ServiceData {
    id?: string;
    title: string;
    description: string;
    price: number;
    type: 'car' | 'bike' | 'visa' | 'esim' | 'tour' | 'transfer';
    provider_id: string;
    features: ServiceFeatures;
    images: string[];

    status?: 'approved' | 'pending' | 'rejected';
    rejection_reason?: string;
}

export interface ServiceModel {
    id: string;
    type: string;
    brand: string;
    model: string;
    description: string;
    image_url: string;
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

export interface Review {
    id?: string;
    property_id: string;
    user_id: string;
    rating: number; // 1-5
    comment: string;
    images?: string[];
    created_at?: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface Notification {
    id?: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at?: string;
    link?: string;
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

    async getPropertiesByHost(hostId: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('host_id', hostId)
            .order('created_at', { ascending: false });

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

        // Only show approved services to public
        query = query.eq('status', 'approved');

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getServicesByProvider(providerId: string) {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getService(id: string) {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async updateService(id: string, updates: Partial<ServiceData>) {
        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Notify Provider
        const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();
        if (service) {
             const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
             await this.createNotification(
                service.provider_id,
                'Service Updated',
                `Your ${typeLabel} service "${service.title}" has been updated by an administrator.`,
                'info'
            );
        }
    },

    async deleteService(id: string, reason?: string) {
        // Fetch details before delete
        const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Notify Provider
        if (service) {
             const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
             await this.createNotification(
                service.provider_id,
                'Service Deleted',
                `Your ${typeLabel} service "${service.title}" has been deleted by an administrator. Reason: ${reason || 'No reason provided'}`,
                'info' // or 'warning'
            );
        }
    },

    async approveService(id: string) {
        const { error } = await supabase
            .from('services')
            .update({ status: 'approved', rejection_reason: null }) // Clear rejection reason
            .eq('id', id);
        if (error) throw error;

        // Notify Provider
        const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();
        if (service) {
            const typeLabel = service.type.charAt(0).toUpperCase() + service.type.slice(1);
            await this.createNotification(
                service.provider_id,
                'Service Approved',
                `Congratulations! Your ${typeLabel} service "${service.title}" has been approved and is now live.`,
                'success'
            );
        }
    },

    async updateServiceStatus(id: string, status: 'approved' | 'rejected' | 'pending', reason?: string) {
        const updates: any = { status };
        if (status === 'rejected' && reason) updates.rejection_reason = reason;

        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);
        if (error) throw error;

        // Notify Provider logic
        if (status !== 'pending') {
            const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();
            if (service) {
                const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
                const title = status === 'approved' ? 'Service Approved' : 'Service Rejected';
                const message = status === 'approved'
                    ? `Congratulations! Your ${typeLabel} service "${service.title}" has been approved and is now live.`
                    : `Your ${typeLabel} service "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`;

                await this.createNotification(service.provider_id, title, message, status === 'approved' ? 'success' : 'error');
            }
        }
    },

    // --- Service Edits (Host Approval Workflow) ---
    async requestServiceUpdate(serviceId: string, changes: Partial<ServiceData>) {
        const { error } = await supabase
            .from('service_edits')
            .insert({
                service_id: serviceId,
                changed_data: changes,
                status: 'pending'
            });

        if (error) throw error;
    },

    async getPendingServiceEdits() {
        // Fetch edits and join with service details to know what's being edited
        const { data, error } = await supabase
            .from('service_edits')
            .select(`
                *,
                service:services (
                    title,
                    provider:profiles(full_name)
                )
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getServiceEditsByService(serviceId: string) {
        const { data, error } = await supabase
            .from('service_edits')
            .select('*')
            .eq('service_id', serviceId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getMyPendingEdits(userId: string) {
        // Find services owned by this user
        const { data: services } = await supabase.from('services').select('id').eq('provider_id', userId);
        if (!services || services.length === 0) return [];

        const serviceIds = services.map(s => s.id);

        const { data, error } = await supabase
            .from('service_edits')
            .select('service_id, status')
            .in('service_id', serviceIds)
            .eq('status', 'pending');

        if (error) throw error;
        return data;
    },

    async getServiceEdit(editId: string) {
        const { data, error } = await supabase
            .from('service_edits')
            .select('*')
            .eq('id', editId)
            .single();

        if (error) throw error;
        return data;
    },

    async deleteServiceEdit(editId: string) {
        const { error } = await supabase
            .from('service_edits')
            .delete()
            .eq('id', editId);

        if (error) throw error;
    },

    async approveServiceEdit(editId: string) {
        // 1. Get the edit data
        const { data: edit, error: fetchError } = await supabase
            .from('service_edits')
            .select('*')
            .eq('id', editId)
            .single();

        if (fetchError) throw fetchError;
        if (!edit) throw new Error('Edit not found');

        // 2. Apply changes to service
        const { error: updateError } = await supabase
            .from('services')
            .update(edit.changed_data)
            .eq('id', edit.service_id);

        if (updateError) throw updateError;

        // 3. Delete the edit record
        const { error: deleteError } = await supabase
            .from('service_edits')
            .delete()
            .eq('id', editId);

        if (deleteError) throw deleteError;

        // Notify Provider
        const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', edit.service_id).single();
        if (service) {
            const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
            await this.createNotification(
                service.provider_id,
                'Update Approved',
                `The changes to your ${typeLabel} service "${service.title}" have been approved.`,
                'success'
            );
        }
    },

    async rejectServiceEdit(editId: string, reason?: string) {
        const { error } = await supabase
            .from('service_edits')
            .update({
                status: 'rejected',
                rejection_reason: reason
            })
            .eq('id', editId);

        if (error) throw error;

        // Notify Provider
        const { data: edit } = await supabase.from('service_edits').select('service_id').eq('id', editId).single();
        if (edit) {
            const { data: service } = await supabase.from('services').select('provider_id, title').eq('id', edit.service_id).single();
            if (service) {
                await this.createNotification(
                    service.provider_id,
                    'Update Rejected',
                    `Your update for "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`,
                    'error'
                );
            }
        }
    },

    async getAdminServices(statusFilter?: string) {
        let query = supabase.from('services').select('*, provider:profiles(full_name)');
        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // --- Services Hierarchy ---
    async getServiceTypes() {
        return ['car', 'bike', 'tour', 'transfer', 'visa', 'esim'];
    },

    async getServiceBrands(type: string) {
        const { data, error } = await supabase
            .from('service_models')
            .select('brand')
            .eq('type', type);

        if (error) throw error;
        return [...new Set(data.map(item => item.brand))];
    },

    async getServiceModels(type: string, brand: string) {
        const { data, error } = await supabase
            .from('service_models')
            .select('*')
            .eq('type', type)
            .eq('brand', brand);

        if (error) throw error;
        return data;
    },

    async getServiceModel(type: string, brand: string, model: string) {
        const { data, error } = await supabase
            .from('service_models')
            .select('*')
            .eq('type', type)
            .eq('brand', brand)
            .eq('model', model)
            .single();

        if (error) return null;
        return data;
    },

    async updateServiceModel(id: string, updates: Partial<ServiceModel>) {
        const { error } = await supabase
            .from('service_models')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async getServicesByModel(type: string, brand: string, model: string) {
        const { data, error } = await supabase
            .from('services')
            .select('*, provider:profiles(full_name)')
            .eq('type', type)
            .contains('features', { brand, model });

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
                const { data } = await supabase.from('properties').select('title, images, price_per_night, location').eq('id', booking.item_id).maybeSingle();
                details = { property: data };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title, images, price, type').eq('id', booking.item_id).maybeSingle();
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

        // Notify Host
        const { data: property } = await supabase.from('properties').select('host_id, title, type').eq('id', id).single();
        if (property) {
            const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
            await this.createNotification(
                property.host_id,
                'Property Updated',
                `Your ${typeLabel} "${property.title}" has been updated by an administrator.`,
                'info'
            );
        }
    },

    async updatePropertyStatus(id: string, status: 'approved' | 'rejected' | 'pending', reason?: string) {
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

                await this.createNotification(
                    property.host_id,
                    title,
                    message,
                    status === 'approved' ? 'success' : 'error'
                );
            }
        }
    },

    async getPropertyTypes() {
        const { data, error } = await supabase
            .from('properties')
            .select('type');
        if (error) throw error;
        return [...new Set(data.map(p => p.type))];
    },

    async getPropertyLocations(type: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('location')
            .eq('type', type);
        if (error) throw error;
        return [...new Set(data.map(p => p.location))];
    },

    async getPropertiesByLocation(type: string, location: string) {
        const { data, error } = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)')
            .eq('type', type)
            .eq('location', location)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
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

    async getUsersByRole(role: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', role)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
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
                const { data } = await supabase.from('properties').select('title').eq('id', booking.item_id).maybeSingle();
                details = { itemTitle: data?.title || 'Unknown Property', itemType: 'Property' };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title').eq('id', booking.item_id).maybeSingle();
                details = { itemTitle: data?.title || 'Unknown Service', itemType: 'Service' };
            }
            return { ...booking, ...details };
        }));

        return enrichedBookings;
    },

    async updateBookingStatus(id: string | number, status: 'confirmed' | 'cancelled' | 'completed') {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    },

    async getBookingsByStatus(status: string) {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, user:profiles(full_name, email)')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const enrichedBookings = await Promise.all(data.map(async (booking) => {
            let details = null;
            if (booking.item_type === 'property') {
                const { data } = await supabase.from('properties').select('title').eq('id', booking.item_id).maybeSingle();
                details = { itemTitle: data?.title || 'Unknown Property', itemType: 'Property' };
            } else if (booking.item_type === 'service') {
                const { data } = await supabase.from('services').select('title').eq('id', booking.item_id).maybeSingle();
                details = { itemTitle: data?.title || 'Unknown Service', itemType: 'Service' };
            }
            return { ...booking, ...details };
        }));

        return enrichedBookings;
    },

    // --- Reviews ---
    async getReviews(propertyId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, user:profiles(full_name, avatar_url)')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Reviews table might not exist yet, using fallback/empty.");
            return [];
        }
        return data;
    },

    async addReview(review: Review) {
        const { data, error } = await supabase
            .from('reviews')
            .insert([review])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- Notifications ---
    async getNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.warn("Notifications table might not exist yet, using fallback.");
            return [];
        }
        return data;
    },

    subscribeToNotifications(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    async createNotification(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string) {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title,
                    message,
                    type,
                    link
                });


            // Trigger Email via Edge Function
            // Note: This runs asynchronously and doesn't block the UI
            try {
                const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single(); // Fetch user email for fallback
                // Trigger Email via Edge Function
                // We pass 'userId' so the function can fetch the email from Auth if needed
                const payload = {
                    userId: userId,
                    to: user?.email,
                    subject: title,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #0d9488;">${title}</h1>
                            <p style="font-size: 16px; color: #374151;">${message}</p>
                            ${link ? `<a href="${window.location.origin}${link}" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Details</a>` : ''}
                            <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;" />
                            <p style="font-size: 12px; color: #9ca3af;">Alanya Holidays Notification</p>
                        </div>
                    `
                };
                
                
                // alert(`DEBUG: Sending Email... \nTo: ${payload.to}`); 

                supabase.functions.invoke('send-email', {
                    body: payload,
                    headers: {
                        // Force using the Anon Key instead of User Session to avoid 401 issues
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                    }
                }).then(({ data, error }) => {
                    if (error) {
                        // alert(`EMAIL ERROR: ${error.message || JSON.stringify(error)}`);
                        console.error('Failed to send email notification:', error);
                    } else {
                        console.log('Email function success:', data);
                    }
                });
            } catch (emailError) {
                console.warn("Failed to trigger email function:", emailError);
            }

        } catch (e) {
            console.error("Failed to create notification", e);
        }
    },

    async markNotificationRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) throw error;
    },

    async addNotification(notification: Notification) {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert([notification]);

            if (error) throw error;
        } catch (e) {
            console.error("Failed to add notification (ignoring if table missing)", e);
        }
    },

    // --- Calendar Sync ---
    async updatePropertyIcal(propertyId: string, icalUrl: string) {
        const { error } = await supabase
            .from('properties')
            .update({ ical_url: icalUrl })
            .eq('id', propertyId);

        if (error) throw error;
    },



    // --- Admin Actions ---
    async approveProperty(id: string | number) {
        // Fetch property details first for notification
        const { data: property } = await supabase.from('properties').select('host_id, title, type').eq('id', id).single();

        const { error } = await supabase
            .from('properties')
            .update({ status: 'approved' })
            .eq('id', id);
        if (error) throw error;

        // Notify Host
        if (property) {
            const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
            await this.createNotification(
                property.host_id,
                'Property Approved',
                `Congratulations! Your ${typeLabel} "${property.title}" has been approved and is now listed.`,
                'success'
            );
        }
    },

    async deleteProperty(id: string | number, reason?: string) {
        // Fetch details before delete
        const { data: property } = await supabase.from('properties').select('host_id, title, type').eq('id', id).single();

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);
        if (error) throw error;

        // Notify Host
        if (property) {
            const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
            await this.createNotification(
                property.host_id,
                'Property Deleted',
                `Your ${typeLabel} "${property.title}" has been deleted by an administrator. Reason: ${reason || 'No reason provided'}`,
                'info'
            );
        }
    },

    async deleteUser(id: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
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
