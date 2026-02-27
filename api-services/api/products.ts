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
        let query = supabase.from('products').select(`
            id, 
            title, 
            description, 
            price, 
            stock, 
            category, 
            images, 
            seller_id, 
            created_at,
            seller:profiles!products_seller_id_fkey(full_name)
        `);

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data as Product[];
    },
    async getProduct(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id, 
                title, 
                description, 
                price, 
                stock, 
                category, 
                images, 
                seller_id, 
                created_at,
                seller:profiles!products_seller_id_fkey(full_name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Product;
    },

    async updateProduct(id: string, updates: Partial<Product>) {
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
