import { supabase } from '../../supabase';
import { PropertyDB, ApprovalStatus } from '../../../types/index';
import { notificationsService } from '../notifications';
import { propertySchema } from '../schemas';
import { getAppUrl } from '../../../utils/appUrl';
import { getPropertyOverride } from '../config';
import { retry } from '../../../utils/retry';
import { createAuditLog } from '../audit';

type _PropertyUpdateInput = Omit<PropertyDB, 'id' | 'created_at' | 'updated_at' | 'status' | 'ical_token' | 'ical_url' | 'last_synced_at'>;

export async function getPropertiesByIds(ids: string[]) {
    if (!ids.length) return [];
    const { data, error } = await supabase
        .from('properties')
        .select('*, host:profiles(full_name, avatar_url)')
        .in('id', ids);
    if (error) throw error;
    return data as PropertyDB[];
}

export async function createProperty(data: Omit<PropertyDB, 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const validatedData = propertySchema.parse({ ...data, host_id: user.id });
    const { data: property, error } = await supabase
        .from('properties')
        .insert([validatedData])
        .select()
        .single();

    if (error) throw error;
    return property as PropertyDB;
}

export async function getProperties(
    page = 1,
    limit = 20,
    filters?: {
        priceRange?: [number, number];
        types?: string[];
        minGuests?: number;
        minBedrooms?: number;
        minBeds?: number;
        minBathrooms?: number;
        hasPhotos?: boolean;
    },
    location?: string,
    allowedIds?: string[],
    sort = 'newest'
) {
    let query = supabase
        .from('properties')
        .select('*, host:profiles(full_name, avatar_url), reviews(count)', { count: 'exact' });

    query = query.eq('status', 'approved');

    if (allowedIds && allowedIds.length > 0) query = query.in('id', allowedIds);

    if (location && location !== 'all') {
        const safeLocation = location.replace(/[%_,.()"']/g, '').trim().slice(0, 100);
        if (safeLocation) {
            query = query.or(`location.ilike.%${safeLocation}%,title.ilike.%${safeLocation}%`);
        }
    }

    if (filters) {
        if (filters.priceRange) {
            query = query.gte('price_per_night', filters.priceRange[0]);
            if (filters.priceRange[1] > 0) query = query.lte('price_per_night', filters.priceRange[1]);
        }
        if (filters.types?.length > 0) {
            query = query.in('type', filters.types.map((t: string) => t.toLowerCase()));
        }
        if (filters.minGuests > 1)    query = query.gte('max_guests', filters.minGuests);
        if (filters.minBedrooms > 0)  query = query.gte('bedrooms', filters.minBedrooms);
        if (filters.minBeds > 1)      query = query.gte('beds', filters.minBeds);
        if (filters.minBathrooms > 1) query = query.gte('bathrooms', filters.minBathrooms);
        if (filters.hasPhotos)        query = query.not('images', 'is', null);
    }

    switch (sort) {
        case 'price_asc':  query = query.order('price_per_night', { ascending: true });  break;
        case 'price_desc': query = query.order('price_per_night', { ascending: false }); break;
        case 'rating':     query = query.order('rating', { ascending: false });          break;
        default:           query = query.order('created_at', { ascending: false });      break;
    }
    query = query.order('id', { ascending: true });

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw error;
    return { data: data as PropertyDB[], count };
}

export async function getAvailableProperties(checkIn: string, checkOut: string) {
    const { data, error } = await supabase.rpc('get_available_properties', {
        check_in_date: checkIn,
        check_out_date: checkOut
    });
    if (error) throw error;
    return data as PropertyDB[];
}

export async function getProperty(id: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let targetId = id;

    if (!isUUID) {
        const overrideId = await getPropertyOverride(id);
        if (overrideId) targetId = overrideId;
    }

    const finalIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    let data: PropertyDB | null, error: Error | null;

    if (finalIsUUID) {
        const { data: authData } = await supabase.auth.getUser();
        const isAuthenticated = !!authData.user;
        const result = await supabase
            .from('properties')
            .select('*, host:profiles(full_name, avatar_url, email, phone, company_name)')
            .eq('id', targetId)
            .single();
        data = result.data;
        error = result.error;
        if (data?.host && !isAuthenticated) {
            const { email: _e, phone: _p, ...safeHost } = data.host;
            data.host = safeHost;
        }
    } else {
        const refId = parseInt(targetId);
        if (!isNaN(refId)) {
            try {
                const result = await supabase.rpc('get_property_by_ref_id', { ref_id_param: refId });
                if (result.data && result.data.length > 0) {
                    data = result.data[0];
                    error = null;
                    if (data.host_id) {
                        const { data: hostData } = await supabase
                            .from('profiles')
                            .select('full_name, avatar_url, email, phone, company_name')
                            .eq('id', data.host_id)
                            .single();
                        if (hostData) data.host = hostData;
                    }
                } else {
                    data = null;
                    error = result.error || { message: 'Property not found' };
                }
            } catch (e: unknown) {
                console.error('Error fetching property by ref_id:', e);
                error = e as Error;
                data = null;
            }
        } else {
            error = { message: 'Invalid property ID format' };
        }
    }

    if (error) throw error;
    return data as PropertyDB;
}

export async function getPropertiesByHost(hostId: string) {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('host_id', hostId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PropertyDB[];
}

export async function getAdminProperties(statusFilter?: string, page = 1, limit = 50) {
    let query = supabase.from('properties').select('*', { count: 'exact' });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + limit - 1);

    if (error) throw error;
    return { data: data as PropertyDB[], count };
}

export async function updateProperty(id: string, updates: Partial<PropertyDB>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingProp } = await supabase
        .from('properties')
        .select('host_id, title, type')
        .eq('id', id)
        .single();

    if (!existingProp || (existingProp.host_id !== user.id && user.user_metadata?.role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { status: _status, ical_token: _t, ical_url: _u, last_synced_at: _lt, ...safeUpdates } = updates as Partial<PropertyDB>;

    const { error } = await supabase.from('properties').update(safeUpdates).eq('id', id);
    if (error) throw error;

    if (existingProp && ('status' in safeUpdates) === false) {
        const typeLabel = existingProp.type === 'villa' ? 'Villa' : 'Apartment';
        await notificationsService.createNotification(
            existingProp.host_id,
            'Property Updated',
            `Your ${typeLabel} "${existingProp.title}" has been updated by an administrator.`,
            'info'
        );
    }
}

export async function updatePropertyStatus(
    id: string,
    status: ApprovalStatus | 'approved' | 'rejected' | 'pending',
    reason?: string
) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error('Not authorized: only admins can change property status');
    }

    const updates: Partial<PropertyDB> = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;
    if (status === 'approved') updates.rejection_reason = null;

    const { error } = await supabase.from('properties').update(updates).eq('id', id);
    if (error) throw error;

    if (status === 'approved') createAuditLog('PROPERTY_APPROVED', { propertyId: id });
    else if (status === 'rejected') createAuditLog('PROPERTY_REJECTED', { propertyId: id, reason });

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
                    data: { title: property.title, reason, link: getAppUrl(`property/${id}`) }
                }
            })).catch(err => console.error('Failed to send status email:', err));
        }
    }

    if (status !== 'pending') {
        const { data: property } = await supabase
            .from('properties')
            .select('host_id, title, type')
            .eq('id', id)
            .single();

        if (property) {
            const typeLabel = property.type === 'villa' ? 'Villa' : 'Apartment';
            const title = status === 'approved' ? 'Property Approved' : 'Property Rejected';
            const message = status === 'approved'
                ? `Congratulations! Your ${typeLabel} "${property.title}" has been approved and is now listed.`
                : `Your ${typeLabel} "${property.title}" was rejected. Reason: ${reason || 'No reason provided'}`;

            await notificationsService.createNotification(
                property.host_id, title, message,
                status === 'approved' ? 'success' : 'error'
            );
        }
    }
}

export async function deleteProperty(id: string, reason?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: property } = await supabase
        .from('properties')
        .select('host_id, title')
        .eq('id', id)
        .single();

    if (!property) throw new Error('Property not found');

    if (property.host_id !== user.id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            throw new Error('Not authorized: only owner or admin can delete properties');
        }
    }

    createAuditLog('PROPERTY_DELETED', { propertyId: id, reason });

    retry(() => supabase.functions.invoke('send-email', {
        body: {
            type: 'listing_deleted',
            userId: property.host_id,
            data: { title: property.title, reason }
        }
    })).catch(err => console.error('Failed to send deletion email:', err));

    await supabase.from('reviews').delete().eq('property_id', id);
    await supabase.from('property_availability').delete().eq('property_id', id);
    await supabase.from('property_ical_feeds').delete().eq('property_id', id);
    await supabase.from('favorites').delete().eq('item_id', id);

    try {
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) throw error;
    } catch {
        console.warn('Hard delete failed, fallback to soft delete.');
        const { error: softError } = await supabase
            .from('properties')
            .update({ status: 'rejected', title: `${property?.title} (Deleted)`, location: 'Archived' })
            .eq('id', id);
        if (softError) { console.error('Even soft delete failed:', softError); throw softError; }
    }
}
