import { supabase } from '../supabase';
import { Product } from '../../types/index';

export const productsService = {
    async createProduct(data: Product) {
        const { data: product, error } = await supabase
            .from('products')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return product as Product;
    },

    async getProducts(category?: string) {
        let query = supabase.from('products').select('*, artisan:profiles(full_name)');

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data as Product[];
    }
};
