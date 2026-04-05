import { supabase } from '../../supabase';
import { ServiceDB, ServiceModel } from '../../../types/index';

export async function getServiceTypes() {
    return ['car', 'bike', 'tour', 'transfer', 'visa', 'esim'];
}

export async function getServiceBrands(type: string) {
    const { data, error } = await supabase
        .from('service_models')
        .select('brand')
        .eq('type', type);
    if (error) throw error;
    return [...new Set(data.map((item: any) => item.brand))];
}

export async function getServiceModels(type: string, brand: string) {
    const { data, error } = await supabase
        .from('service_models')
        .select('*')
        .eq('type', type)
        .eq('brand', brand);
    if (error) throw error;
    return data as ServiceModel[];
}

export async function getServiceModel(type: string, brand: string, model: string) {
    const { data, error } = await supabase
        .from('service_models')
        .select('*')
        .eq('type', type)
        .eq('brand', brand)
        .eq('model', model)
        .single();
    if (error) return null;
    return data as ServiceModel;
}

export async function updateServiceModel(id: string, updates: Partial<ServiceModel>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') throw new Error('Not authorized');

    const { error } = await supabase.from('service_models').update(updates).eq('id', id);
    if (error) throw error;
}

export async function getServicesByModel(type: string, brand: string, model: string) {
    const { data, error } = await supabase
        .from('services')
        .select('*, provider:profiles(full_name)')
        .eq('type', type)
        .contains('features', { brand, model });
    if (error) throw error;
    return data as ServiceDB[];
}
