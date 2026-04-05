import { supabase } from '../../supabase';
import { ServiceDB } from '../../../types/index';
import { notificationsService } from '../notifications';

// Fields that must never be overwritten via service_edits
export const IMMUTABLE_SERVICE_FIELDS = new Set([
    'id', 'provider_id', 'status', 'created_at', 'updated_at'
]);

export async function requestServiceUpdate(serviceId: string, changes: Partial<ServiceDB>) {
    const { error } = await supabase
        .from('service_edits')
        .insert({ service_id: serviceId, changed_data: changes, status: 'pending' });
    if (error) throw error;
}

export async function getPendingServiceEdits() {
    const { data, error } = await supabase
        .from('service_edits')
        .select(`*, service:services(title, provider:profiles(full_name))`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getServiceEditsByService(serviceId: string) {
    const { data, error } = await supabase
        .from('service_edits')
        .select('*')
        .eq('service_id', serviceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getMyPendingEdits(userId: string) {
    const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('provider_id', userId);

    if (!services || services.length === 0) return [];

    const { data, error } = await supabase
        .from('service_edits')
        .select('service_id, status')
        .in('service_id', services.map(s => s.id))
        .eq('status', 'pending');

    if (error) throw error;
    return data;
}

export async function getServiceEdit(editId: string) {
    const { data, error } = await supabase
        .from('service_edits')
        .select('*')
        .eq('id', editId)
        .single();
    if (error) throw error;
    return data;
}

export async function deleteServiceEdit(editId: string) {
    const { error } = await supabase.from('service_edits').delete().eq('id', editId);
    if (error) throw error;
}

export async function approveServiceEdit(editId: string) {
    const { data: edit, error: fetchError } = await supabase
        .from('service_edits')
        .select('*')
        .eq('id', editId)
        .single();

    if (fetchError) throw fetchError;
    if (!edit) throw new Error('Edit not found');

    const safeChanges: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(edit.changed_data)) {
        if (!IMMUTABLE_SERVICE_FIELDS.has(key)) safeChanges[key] = value;
    }

    const { error: updateError } = await supabase
        .from('services')
        .update(safeChanges)
        .eq('id', edit.service_id);
    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
        .from('service_edits')
        .delete()
        .eq('id', editId);
    if (deleteError) throw deleteError;

    const { data: service } = await supabase
        .from('services')
        .select('provider_id, title, type')
        .eq('id', edit.service_id)
        .single();

    if (service) {
        const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
        await notificationsService.createNotification(
            service.provider_id,
            'Update Approved',
            `The changes to your ${typeLabel} service "${service.title}" have been approved.`,
            'success'
        );
    }
}

export async function rejectServiceEdit(editId: string, reason?: string) {
    const { error } = await supabase
        .from('service_edits')
        .update({ status: 'rejected', rejection_reason: reason })
        .eq('id', editId);
    if (error) throw error;

    const { data: edit } = await supabase
        .from('service_edits')
        .select('service_id')
        .eq('id', editId)
        .single();

    if (edit) {
        const { data: service } = await supabase
            .from('services')
            .select('provider_id, title')
            .eq('id', edit.service_id)
            .single();

        if (service) {
            await notificationsService.createNotification(
                service.provider_id,
                'Update Rejected',
                `Your update for "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`,
                'error'
            );
        }
    }
}
