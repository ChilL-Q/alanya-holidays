import { supabase } from '../../supabase';
import { ServiceDB, ApprovalStatus } from '../../../types/index';
import { notificationsService } from '../notifications';
import { serviceSchema } from '../schemas';
import { getAppUrl } from '../../../utils/appUrl';
import { retry } from '../../../utils/retry';
import { createAuditLog } from '../audit';

export async function createService(data: Omit<ServiceDB, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insertData = { ...data, provider_id: user.id };
    serviceSchema.parse(insertData);

    const { data: service, error } = await supabase
        .from('services')
        .insert([insertData])
        .select()
        .single();

    if (error) throw error;
    return service as ServiceDB;
}

export async function getServices(type?: string, page = 1, limit = 20) {
    let query = supabase
        .from('services')
        .select('*, provider:profiles(full_name, company_name)', { count: 'exact' })
        .eq('status', 'approved');

    if (type) query = query.eq('type', type);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

    if (error) throw error;

    const mappedData = (data as ServiceDB[]).map(s => ({
        ...s,
        service_ref: s.service_ref || parseInt(s.id.slice(0, 8), 16) % 10000
    }));

    return { data: mappedData, count };
}

export async function getServicesByProvider(providerId: string) {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ServiceDB[];
}

export async function getService(id: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabase.from('services').select('*');
    query = isUUID ? query.eq('id', id) : query.eq('service_ref', parseInt(id));

    const { data, error } = await query.single();

    if ((error || !data) && !isUUID) {
        const { data: found } = await supabase
            .from('services')
            .select('*')
            .eq('service_ref', parseInt(id))
            .maybeSingle();
        if (found) return found as ServiceDB;
    }

    if (error) throw error;
    return data as ServiceDB;
}

export async function updateService(id: string, updates: Partial<ServiceDB>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingService } = await supabase
        .from('services')
        .select('provider_id, title, type')
        .eq('id', id)
        .single();

    if (!existingService || (existingService.provider_id !== user.id && user.user_metadata?.role !== 'admin')) {
        throw new Error('Not authorized');
    }

    const { status: _s, provider_id: _p, id: _id, created_at: _c, updated_at: _u, ...safeUpdates } = updates as any;
    const { error } = await supabase.from('services').update(safeUpdates).eq('id', id);
    if (error) throw error;

    const { data: service } = await supabase
        .from('services')
        .select('provider_id, title, type')
        .eq('id', id)
        .single();

    if (service) {
        const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
        await notificationsService.createNotification(
            service.provider_id,
            'Service Updated',
            `Your ${typeLabel} service "${service.title}" has been updated by an administrator.`,
            'info'
        );
    }
}

export async function deleteService(id: string, reason?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('provider_id, title, type')
        .eq('id', id)
        .single();

    if (fetchError || !service) throw new Error('Service not found');

    if (service.provider_id !== user.id && user.user_metadata?.role !== 'admin') {
        throw new Error('Not authorized');
    }

    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;

    const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
    await notificationsService.createNotification(
        service.provider_id,
        'Service Deleted',
        `Your ${typeLabel} service "${service.title}" has been deleted by an administrator. Reason: ${reason || 'No reason provided'}`,
        'info'
    );
}

export async function updateServiceStatus(
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

    if (profile?.role !== 'admin') throw new Error('Not authorized: only admins can change service status');

    const updates: any = { status };
    if (status === 'rejected' && reason) updates.rejection_reason = reason;

    const { error } = await supabase.from('services').update(updates).eq('id', id);
    if (error) throw error;

    if (status === 'approved') createAuditLog('SERVICE_APPROVED', { serviceId: id });
    else if (status === 'rejected') createAuditLog('SERVICE_REJECTED', { serviceId: id, reason });

    if (status !== 'pending') {
        const { data: service } = await supabase
            .from('services')
            .select('provider_id, title, type')
            .eq('id', id)
            .single();

        if (service) {
            if (status === 'approved' || status === 'rejected') {
                retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        type: status === 'approved' ? 'service_approved' : 'service_rejected',
                        userId: service.provider_id,
                        data: { title: service.title, reason, link: getAppUrl(`/service/${id}`) }
                    }
                })).catch(err => console.error('Failed to send status email:', err));
            }

            const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
            const title = status === 'approved' ? 'Service Approved' : 'Service Rejected';
            const message = status === 'approved'
                ? `Congratulations! Your ${typeLabel} service "${service.title}" has been approved and is now live.`
                : `Your ${typeLabel} service "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`;

            await notificationsService.createNotification(
                service.provider_id, title, message,
                status === 'approved' ? 'success' : 'error'
            );
        }
    }
}

export async function getAdminServices(statusFilter?: string, typesFilter?: string[], page = 1, limit = 50) {
    let query = supabase.from('services').select('*, provider:profiles(full_name)', { count: 'exact' });
    if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typesFilter && typesFilter.length > 0)  query = query.in('type', typesFilter);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);

    if (error) throw error;
    return { data: data as ServiceDB[], count };
}
