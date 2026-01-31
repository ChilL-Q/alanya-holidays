import { supabase } from '../supabase';
import { PropertyDB, ApprovalStatus, Review } from '../../types/index';
import { NotificationType } from '../../types/enums';
import { notificationsService } from './notifications';
import { propertySchema } from './schemas';

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
        const validatedData = propertySchema.parse(data);
        const { data: property, error } = await supabase
            .from('properties')
            .insert([validatedData])
            .select()
            .single();

        if (error) throw error;
        return property as PropertyDB;
    },

    async getProperties(page = 1, limit = 20, filters?: any, location?: string, allowedIds?: string[], sort: string = 'newest') {
        // Optimized: removed * and selected specific fields if needed
        let query = supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url), reviews(count)', { count: 'exact' });

        query = query.eq('status', 'approved');

        // Availability Filter (Server-Side)
        if (allowedIds && allowedIds.length > 0) {
            query = query.in('id', allowedIds);
        }

        // Server-Side Filtering
        if (location && location !== 'all') {
            // Case-insensitive check for location or title
            query = query.or(`location.ilike.%${location}%,title.ilike.%${location}%`);
        }

        if (filters) {
            if (filters.priceRange) {
                query = query.gte('price_per_night', filters.priceRange[0]);
                if (filters.priceRange[1] > 0) {
                    query = query.lte('price_per_night', filters.priceRange[1]);
                }
            }

            if (filters.types && filters.types.length > 0) {
                 const lowerTypes = filters.types.map((t: string) => t.toLowerCase());
                 query = query.in('type', lowerTypes);
            }

            if (filters.minGuests > 1) query = query.gte('max_guests', filters.minGuests);
            if (filters.minBedrooms > 0) query = query.gte('bedrooms', filters.minBedrooms);
            if (filters.minBeds > 1) query = query.gte('beds', filters.minBeds);
            if (filters.minBathrooms > 1) query = query.gte('bathrooms', filters.minBathrooms);
            
            // hasPhotos filter? 'images' is an array.
            // checking array length in PostgREST is tricky without a dedicated column or function.
            // ignoring 'hasPhotos' server-side for MVP unless critically needed, or using not.is.images.null
            if (filters.hasPhotos) {
                 query = query.not('images', 'is', null);
            }
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                query = query.order('price_per_night', { ascending: true });
                break;
            case 'price_desc':
                query = query.order('price_per_night', { ascending: false });
                break;
            case 'rating':
                query = query.order('rating', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
                break;
        }

        // Secondary sort for stable pagination
        query = query.order('id', { ascending: true });

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .range(from, to);

        if (error) throw error;
        
        // Mock property_ref for now (use hashing or slicing if not present)
        const mappedData = (data as PropertyDB[]).map(p => {
            // CENTRALIZED FIX: Nar Villa Data Override
            if (p.id === 'eee2d685-eac5-4ec8-bd24-63fea94f25ee') {
                return {
                    ...p,
                    property_ref: 1001 // Fixed Friendly ID for Nar Villa (Data now in DB)
                };
            }
            // CENTRALIZED FIX: Castle View Penthouse Data Override
            if (p.title === 'Castle View Penthouse') {
                return {
                    ...p,
                    property_ref: 1002 // Fixed Friendly ID for Castle View (Data now in DB)
                };
            }
            return {
                ...p,
                property_ref: p.property_ref || parseInt(p.id.slice(0, 8), 16) % 10000 // Temporary mock ID
            };
        });

        return { data: mappedData, count };
    },

    async getAvailableProperties(checkIn: string, checkOut: string) {
        const { data, error } = await supabase
            .rpc('get_available_properties', {
                check_in_date: checkIn,
                check_out_date: checkOut
            });

        if (error) throw error;
        
        // We also need to fetch the host details for these properties manually or via a join if RPC allows.
        // Since RPC returns 'setof properties', it doesn't include the joined 'host' relation automatically.
        // We can either fetch hosts separately or update RPC to return a custom type.
        // For simplicity/speed, let's just return properties. The UI might need host info (avatar), 
        // but let's check if PropertyCard uses it. Yes, it uses basic info.
        // Actually, PropertyCard doesn't seem to display Host info in the current design (just image, title, location, rating).
        // So raw properties are fine.
        
        return data as PropertyDB[];
    },

    async getProperty(id: string) {
        // Check if id is UUID or Reference
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        
        let data, error;
        
        if (isUUID) {
            const result = await supabase
                .from('properties')
                .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
                .eq('id', id)
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Use RPC to bypass schema cache issues - returns array
            try {
                const result = await supabase
                    .rpc('get_property_by_ref_id', { ref_id_param: parseInt(id) });
                
                // Get first item from array (RPC returns array, not single object)
                if (result.data && result.data.length > 0) {
                    data = result.data[0];
                    error = null;
                    
                    // Fetch host data separately if property found
                    if (data.host_id) {
                        const { data: hostData } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url, email, phone, company_name')
                            .eq('id', data.host_id)
                            .single();
                        if (hostData) {
                            data.host = hostData;
                        }
                    }
                } else {
                    data = null;
                    error = result.error || { message: 'Property not found' };
                }
            } catch (e) {
                console.error('Error fetching property by ref_id:', e);
                error = e;
                data = null;
            }
        }

        // Fallback for mock environment if property_ref not in DB
        if ((error || !data) && !isUUID) {
             // CENTRALIZED FIX: Handle specific mock IDs
             if (id === '1001') {
                 const { data: nar } = await supabase
                    .from('properties')
                    .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
                    .eq('id', 'eee2d685-eac5-4ec8-bd24-63fea94f25ee') // Nar Villa UUID
                    .single();
                 if (nar) {
                     nar.property_ref = 1001; // Data now in DB
                     return nar as PropertyDB;
                 }
             }

             if (id === '1002') {
                 const { data: castle } = await supabase
                    .from('properties')
                    .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
                    .eq('title', 'Castle View Penthouse')
                    .single();
                 if (castle) {
                     castle.property_ref = 1002; // Data now in DB
                     return castle as PropertyDB;
                 }
             }

             // Generic fallback logic
             const { data: all } = await supabase.from('properties').select('*, host:profiles(full_name, avatar_url, email, phone, company_name)');
             if (all) {
                 const found = all.find((p: any) => (parseInt(p.id.slice(0, 8), 16) % 10000).toString() === id);
                 if (found) return found as PropertyDB;
             }
             if (error) throw error;
        }

        if (error) throw error;
        
        // CENTRALIZED FIX: ID Mapping only
        if (data && data.id === 'eee2d685-eac5-4ec8-bd24-63fea94f25ee') {
            data.property_ref = 1001;
        }
        if (data && data.title === 'Castle View Penthouse') {
            data.property_ref = 1002;
        }

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
            .order('id', { ascending: true })
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

        // Notify Host via Email
        if (status === 'approved' || status === 'rejected') {
            const { data: property } = await supabase
                .from('properties')
                .select('host_id, title')
                .eq('id', id)
                .single();
            
            if (property) {
                supabase.functions.invoke('send-email', {
                    body: {
                        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
                        userId: property.host_id,
                        data: {
                            title: property.title,
                            reason: reason,
                            link: `${window.location.origin}/property/${id}`
                        }
                    }
                }).catch(err => console.error('Failed to send status email:', err));
            }
        }

        // Notify Host via In-App Notification (Keep existing logic)
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

    async getReviewCount(propertyId: string) {
        const { count, error } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', propertyId);
        
        if (error) throw error;
        return count || 0;
    },

    async addReview(review: Omit<Review, 'id' | 'created_at'>) {
        const { error, data: newReview } = await supabase
            .from('reviews')
            .insert([review])
            .select()
            .single();
            
        if (error) throw error;

        // Notify Host of New Review
        const { data: property } = await supabase
            .from('properties')
            .select('host_id, title')
            .eq('id', review.property_id)
            .single();

        if (property) {
             // Fetch guest name (optional, but good for email)
             // We can assume we have user context if we needed, but let's just use generic or fetch if critical
             // For now, let's send basic notification
             supabase.functions.invoke('send-email', {
                body: {
                    type: 'new_review',
                    userId: property.host_id,
                    data: {
                        itemTitle: property.title,
                        rating: review.rating,
                        comment: review.comment,
                        guestName: 'A Guest', // We'd need to fetch user profile to get specific name
                        link: `${window.location.origin}/property/${review.property_id}`
                    }
                }
            }).catch(err => console.error('Failed to send review email:', err));
        }
    },

    async deleteReview(reviewId: string, userId: string) {
        // First check if user owns this review
        const { data: review, error: fetchError } = await supabase
            .from('reviews')
            .select('user_id')
            .eq('id', reviewId)
            .single();

        if (fetchError) throw fetchError;
        if (!review) throw new Error('Review not found');
        if (review.user_id !== userId) throw new Error('Unauthorized: You can only delete your own reviews');

        // Delete the review
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;
    },

    async deleteProperty(id: string, reason?: string) {
        // Fetch details before deletion to notify host
        const { data: property } = await supabase
            .from('properties')
            .select('host_id, title')
            .eq('id', id)
            .single();

        if (property) {
             supabase.functions.invoke('send-email', {
                body: {
                    type: 'listing_deleted',
                    userId: property.host_id,
                    data: {
                        title: property.title,
                        reason: reason
                    }
                }
            }).catch(err => console.error('Failed to send deletion email:', err));
        }

        // 1. Delete Dependencies (Manual Cascade)
        // Reviews (Fixes FK constraint error)
        await supabase.from('reviews').delete().eq('property_id', id);
        
        // Availability & Calendar
        await supabase.from('property_availability').delete().eq('property_id', id);
        await supabase.from('property_ical_feeds').delete().eq('property_id', id);

        // Favorites
        await supabase.from('favorites').delete().eq('item_id', id);

        // Bookings - Optional: Soft delete preferred, but for now specific cleanup if needed
        // await supabase.from('bookings').delete().eq('item_id', id).eq('item_type', 'property');

        // 2. Delete the Property (Try Hard Delete first)
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id); 
            
            if (error) throw error;
        } catch (err: any) {
            console.warn('Hard delete failed, fallback to soft delete.', err);
            
            // Unconditional Soft Delete as fallback for ANY error (FK, RLS, etc.)
            // This ensures user gets the "Deleted" experience even if DB restrictions apply.
            const { error: softError } = await supabase
                .from('properties')
                .update({ 
                    status: 'rejected', 
                    title: `${property?.title} (Deleted)`,
                    location: 'Archived' 
                })
                .eq('id', id);
            
            if (softError) {
                console.error('Even soft delete failed:', softError);
                throw softError; 
            }
            

            return; 
        }
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

    async getPropertiesByLocation(type: string, location: string, page = 1, limit = 20) {
        let query = supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url)', { count: 'exact' });
        
        query = query.eq('type', type);

        // Case insensitive search using ilike for location if needed, but exact match requested here
        query = query.eq('location', location);
            
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .range(from, to);

        if (error) throw error;
        return { data: data as PropertyDB[], count };
    },

    // Availability & Calendar
    async getPropertyAvailability(propertyId: string, startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('property_availability')
            .select('*, feed:property_ical_feeds(name)')
            .eq('property_id', propertyId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;
        return data as any[]; // Type assertion needed or update types import
    },

    async updatePropertyAvailability(
        propertyId: string, 
        dates: string[], 
        status: 'available' | 'booked' | 'blocked', 
        price?: number
    ) {
        // If status is 'available', we remove the entry (unless we want to keep price override?)
        // Strategy: 
        // 1. Delete existing entries for these dates
        // 2. If status != available or price is set, insert new entries

        const { error: deleteError } = await supabase
            .from('property_availability')
            .delete()
            .eq('property_id', propertyId)
            .in('date', dates);
        
        if (deleteError) throw deleteError;

        if (status === 'available' && !price) {
            return; // Just clearing
        }

        const entries = dates.map(date => ({
            property_id: propertyId,
            date,
            status,
            price,
            source: 'manual'
        }));

        const { error: insertError } = await supabase
            .from('property_availability')
            .insert(entries);

        if (insertError) throw insertError;
    },

    async syncPropertyCalendar(propertyId: string) {
        const { data, error } = await supabase.functions.invoke('sync-ical', {
            body: { propertyId }
        });
        if (error) throw error;
        return data;
    },

    async getUnavailableDates(propertyId: string) {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('property_availability')
            .select('date')
            .eq('property_id', propertyId)
            .gte('date', today)
            .neq('status', 'available');

        if (error) throw error;
        return (data || []).map((row: any) => row.date);
    },

    // Multi-Calendar Management
    async getICalFeeds(propertyId: string) {
        const { data, error } = await supabase
            .from('property_ical_feeds')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data as any[]; // Need to import PropertyICalFeed type properly if possible, or cast later
    },

    async addICalFeed(propertyId: string, name: string, url: string) {
        const { data, error } = await supabase
            .from('property_ical_feeds')
            .insert([{ property_id: propertyId, name, url }])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    async removeICalFeed(id: string) {
        // First, delete availability entries associated with this feed
        // (Though ON DELETE CASCADE on the foreign key should handle this automatically in DB,
        // it's good to be aware. We rely on DB cascade here.)
        const { error } = await supabase
            .from('property_ical_feeds')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    }
};
