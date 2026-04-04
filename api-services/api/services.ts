import { supabase } from '../supabase';
import { ServiceDB, ServiceModel, ApprovalStatus } from '../../types/index';
import { notificationsService } from './notifications';
import { serviceSchema } from './schemas';
import { getAppUrl } from '../../utils/appUrl';
import { retry } from '../../utils/retry';
import { createAuditLog } from './audit';

// Fields that must never be overwritten via service_edits
const IMMUTABLE_SERVICE_FIELDS = new Set([
    'id', 'provider_id', 'status', 'created_at', 'updated_at'
]);

export const servicesService = {
    async createService(data: Omit<ServiceDB, 'id' | 'created_at'>) {
        const validatedData = serviceSchema.parse(data);
        const { data: service, error } = await supabase
            .from('services')
            .insert([validatedData])
            .select()
            .single();

        if (error) throw error;
        return service as ServiceDB;
    },

    async getServices(type?: string, page = 1, limit = 20) {
        let query = supabase.from('services').select('*, provider:profiles(full_name, company_name)', { count: 'exact' });

        if (type) {
            query = query.eq('type', type);
        }

        // Only show approved services to public
        query = query.eq('status', 'approved');

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        if (error) throw error;
        
        const mappedData = (data as ServiceDB[]).map(s => ({
            ...s,
            service_ref: s.service_ref || parseInt(s.id.slice(0, 8), 16) % 10000 
        }));

        return { data: mappedData, count };
    },

    async getServicesByProvider(providerId: string) {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ServiceDB[];
    },

    async getService(id: string) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let query = supabase.from('services').select('*');
        if (isUUID) {
            query = query.eq('id', id);
        } else {
             query = query.eq('service_ref', parseInt(id));
        }

        const { data, error } = await query.single();
        
        // Optimized Fallback check: Query by service_ref if it was a number but look-up failed
        if ((error || !data) && !isUUID) {
             const { data: found } = await supabase
                .from('services')
                .select('*')
                // This is a bit of a hack since service_ref is SERIAL and we are matching string id
                // But it's much better than fetching everything.
                .eq('service_ref', parseInt(id))
                .maybeSingle();
             
             if (found) return found as ServiceDB;
        }

        if (error) throw error;
        return data as ServiceDB;
    },

    async updateService(id: string, updates: Partial<ServiceDB>) {
        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        // Notify Provider
        const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();
        if (service) {
             const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
             await notificationsService.createNotification(
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
             await notificationsService.createNotification(
                service.provider_id,
                'Service Deleted',
                `Your ${typeLabel} service "${service.title}" has been deleted by an administrator. Reason: ${reason || 'No reason provided'}`,
                'info'
            );
        }
    },

    async updateServiceStatus(id: string, status: ApprovalStatus | 'approved' | 'rejected' | 'pending', reason?: string) {
        const updates: any = { status };
        if (status === 'rejected' && reason) updates.rejection_reason = reason;

        const { error } = await supabase
            .from('services')
            .update(updates)
            .eq('id', id);
        if (error) throw error;

        // Audit log for status change
        if (status === 'approved') {
            createAuditLog('SERVICE_APPROVED', { serviceId: id });
        } else if (status === 'rejected') {
            createAuditLog('SERVICE_REJECTED', { serviceId: id, reason });
        }

        // Notify Provider logic
        if (status !== 'pending') {
            const { data: service } = await supabase.from('services').select('provider_id, title, type').eq('id', id).single();
            if (service) {
                // 1. Send Email
                if (status === 'approved' || status === 'rejected') {
                    retry(() => supabase.functions.invoke('send-email', {
                        body: {
                            type: status === 'approved' ? 'service_approved' : 'service_rejected',
                            userId: service.provider_id,
                            data: {
                                title: service.title,
                                reason: reason,
                                link: getAppUrl(`/service/${id}`)
                            }
                        }
                    })).catch(err => console.error('Failed to send status email:', err));
                }

                // 2. In-App Notification
                const typeLabel = service.type ? (service.type.charAt(0).toUpperCase() + service.type.slice(1)) : 'Service';
                const title = status === 'approved' ? 'Service Approved' : 'Service Rejected';
                const message = status === 'approved'
                    ? `Congratulations! Your ${typeLabel} service "${service.title}" has been approved and is now live.`
                    : `Your ${typeLabel} service "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`;

                await notificationsService.createNotification(service.provider_id, title, message, status === 'approved' ? 'success' : 'error');
            }
        }
    },

    async approveService(id: string) {
        await this.updateServiceStatus(id, 'approved');
    },

    async getAdminServices(statusFilter?: string, typesFilter?: string[], page = 1, limit = 50) {
        let query = supabase.from('services').select('*, provider:profiles(full_name)', { count: 'exact' });
        if (statusFilter && statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        if (typesFilter && typesFilter.length > 0) {
            query = query.in('type', typesFilter);
        }
        
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;
        return { data: data as ServiceDB[], count };
    },
    
    // --- Service Models (Brands/Models) ---
    async getServiceTypes() {
        return ['car', 'bike', 'tour', 'transfer', 'visa', 'esim'];
    },

    async getServiceBrands(type: string) {
        const { data, error } = await supabase
            .from('service_models')
            .select('brand')
            .eq('type', type);

        if (error) throw error;
        return [...new Set(data.map((item: any) => item.brand))];
    },

    async getServiceModels(type: string, brand: string) {
        const { data, error } = await supabase
            .from('service_models')
            .select('*')
            .eq('type', type)
            .eq('brand', brand);

        if (error) throw error;
        return data as ServiceModel[];
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
        return data as ServiceModel;
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
        return data as ServiceDB[];
    },

    // --- Service Edits (Host Approval Workflow) ---
    // Moved to strict typing? Or keep ANY for 'changed_data'?
    async requestServiceUpdate(serviceId: string, changes: Partial<ServiceDB>) {
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
        return data; // Type is complex here (Edit + Joined Service), can define interface if needed
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

        // 2. Sanitize changed_data — strip immutable fields
        const safeChanges: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(edit.changed_data)) {
            if (!IMMUTABLE_SERVICE_FIELDS.has(key)) {
                safeChanges[key] = value;
            }
        }

        // 3. Apply changes to service
        const { error: updateError } = await supabase
            .from('services')
            .update(safeChanges)
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
            await notificationsService.createNotification(
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
                await notificationsService.createNotification(
                    service.provider_id,
                    'Update Rejected',
                    `Your update for "${service.title}" was rejected. Reason: ${reason || 'No reason provided'}`,
                    'error'
                );
            }
        }
    },
};
