import { supabase } from '../supabase';
import { PropertyDB, ApprovalStatus, Review, PropertyAvailability, PropertyICalFeed } from '../../types/index';
import { notificationsService } from './notifications';
import { propertySchema, reviewSchema } from './schemas';
import { getAppUrl } from '../../utils/appUrl';
import { getPropertyOverride } from './config';
import { retry } from '../../utils/retry';
import { createAuditLog } from './audit';

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

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
            // Strip characters that have special meaning in PostgREST filter syntax
            const safeLocation = location.replace(/[%_,.()"']/g, '').trim().slice(0, 100);
            if (safeLocation) {
                query = query.or(`location.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`);
            }
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
        
        return { data: data as PropertyDB[], count };
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
        // Check if id is UUID or Reference/Slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        let targetId = id;
        
        // If not UUID, check for slug override
        if (!isUUID) {
            const overrideId = await getPropertyOverride(id);
            if (overrideId) {
                targetId = overrideId;
            }
        }

        // Re-check if we now have a UUID (either original or from override)
        const finalIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
        
        let data, error;
        
        if (finalIsUUID) {
            // Don't expose host PII (email, phone) to unauthenticated users
            const { data: authData } = await supabase.auth.getUser();
            const isAuthenticated = !!authData.user;

            const result = await supabase
                .from('properties')
                .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
                .eq('id', targetId)
                .single();
            data = result.data;
            error = result.error;

            // Strip PII from host data for unauthenticated visitors
            if (data?.host && !isAuthenticated) {
                const { email, phone, ...safeHost } = data.host;
                data.host = safeHost;
            }
        } else {
            // Try numeric ref_id lookup via RPC
            const refId = parseInt(targetId);
            if (!isNaN(refId)) {
                try {
                    const result = await supabase
                        .rpc('get_property_by_ref_id', { ref_id_param: refId });
                    
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
            } else {
                error = { message: 'Invalid property ID format' };
            }
        }

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
            .order('id', { ascending: true })
            .range(from, to);

        if (error) throw error;
        return { data: data as PropertyDB[], count };
    },


    async updateProperty(id: string, updates: Partial<PropertyDB>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Full fetch for auth check and notification
        const { data: existingProp } = await supabase
            .from('properties')
            .select('host_id, title, type')
            .eq('id', id)
            .single();

        if (!existingProp || (existingProp.host_id !== user.id && user.user_metadata?.role !== 'admin')) {
            throw new Error('Not authorized');
        }

        // Prevent status bypass via general update — only updatePropertyStatus should change status
        const { status, ical_token, ical_url, last_synced_at: _lt, ...safeUpdates } = updates as any;

        const { error } = await supabase
            .from('properties')
            .update(safeUpdates)
            .eq('id', id);

        if (error) throw error;

        if (existingProp && safeUpdates.status === undefined) {
             const typeLabel = existingProp.type === 'villa' ? 'Villa' : 'Apartment';
             await notificationsService.createNotification(
                 existingProp.host_id,
                 'Property Updated',
                 `Your ${typeLabel} "${existingProp.title}" has been updated by an administrator.`,
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

        // Audit log for status change
        if (status === 'approved') {
            createAuditLog('PROPERTY_APPROVED', { propertyId: id });
        } else if (status === 'rejected') {
            createAuditLog('PROPERTY_REJECTED', { propertyId: id, reason });
        }

        // Notify Host via Email
        if (status === 'approved' || status === 'rejected') {
            const { data: property } = await supabase
                .from('properties')
                .select('host_id, title')
                .eq('id', id)
                .single();
            
            if (property) {
                retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
                        userId: property.host_id,
                        data: {
                            title: property.title,
                            reason: reason,
                            link: getAppUrl(`property/${id}`)
                        }
                    }
                })).catch(err => console.error('Failed to send status email:', err));
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
        // Validate input
        const validatedData = reviewSchema.parse(review);

        // Check for duplicate review (same user on same property)
        const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('property_id', validatedData.property_id)
            .eq('user_id', validatedData.user_id)
            .maybeSingle();

        if (existing) {
            throw new Error('You have already submitted a review for this property');
        }

        const { error } = await supabase
            .from('reviews')
            .insert([validatedData])
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
            retry(() => supabase.functions.invoke('send-email', {
                body: {
                    type: 'new_review',
                    userId: property.host_id,
                    data: {
                        itemTitle: property.title,
                        rating: review.rating,
                        comment: review.comment,
                        guestName: 'A Guest', // We'd need to fetch user profile to get specific name
                        link: getAppUrl(`property/${review.property_id}`)
                    }
                }
            })).catch(err => console.error('Failed to send review email:', err));
        }
    },

    async deleteReview(reviewId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // First check if user owns this review
        const { data: review, error: fetchError } = await supabase
            .from('reviews')
            .select('user_id')
            .eq('id', reviewId)
            .single();

        if (fetchError) throw fetchError;
        if (!review) throw new Error('Review not found');
        if (review.user_id !== user.id) throw new Error('Unauthorized: You can only delete your own reviews');

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

        // Audit log for deletion
        createAuditLog('PROPERTY_DELETED', { propertyId: id, reason });

        if (property) {
            retry(() => supabase.functions.invoke('send-email', {
                body: {
                    type: 'listing_deleted',
                    userId: property.host_id,
                    data: {
                        title: property.title,
                        reason: reason
                    }
                }
            })).catch(err => console.error('Failed to send deletion email:', err));
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
        } catch {
            console.warn('Hard delete failed, fallback to soft delete.');
            
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
        return data as PropertyAvailability[];
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
        return (data || []).map(row => row.date);
    },

    // Multi-Calendar Management
    async getICalFeeds(propertyId: string) {
        const { data, error } = await supabase
            .from('property_ical_feeds')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data as PropertyICalFeed[];
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
