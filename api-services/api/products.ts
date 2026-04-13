import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { Product } from '../../types/index';
import { productSchema, productVariantSchema } from './schemas';

export interface ProductVariant {
    id: string;
    product_id: string;
    size_label: string;
    price: number;
    stock: number;
    sku: string | null;
    created_at: string;
}

export const productsService = {
    async createProduct(data: Product) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const insertData = { ...data, seller_id: user.id };
        const validatedData = productSchema.parse(insertData);

        const { data: product, error } = await supabase
            .from('products')
            .insert([validatedData])
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: existingProduct } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();

        const role = await getUserRole(user.id);
        if (!existingProduct || (existingProduct.seller_id !== user.id && role !== 'admin')) {
            throw new Error('Not authorized');
        }

        // Prevent seller_id hijacking
        const { seller_id: _sellerId, ...safeUpdates } = updates;

        const { error } = await supabase
            .from('products')
            .update(safeUpdates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteProduct(id: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: existingProduct } = await supabase
            .from('products')
            .select('seller_id')
            .eq('id', id)
            .single();

        const role = await getUserRole(user.id);
        if (!existingProduct || (existingProduct.seller_id !== user.id && role !== 'admin')) {
            throw new Error('Not authorized');
        }

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ============================================================
    // Product Variants CRUD
    // ============================================================

    async getProductVariants(productId: string) {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ProductVariant[];
    },

    async createProductVariant(productId: string, data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify user owns the product
        const role = await getUserRole(user.id);
        const { data: product } = await supabase
            .from('products')
            .select('seller_id, artisan_id')
            .eq('id', productId)
            .single();

        if (!product || (product.seller_id !== user.id && product.artisan_id !== user.id && role !== 'admin')) {
            throw new Error('Not authorized');
        }

        const validatedData = productVariantSchema.parse(data);

        const { data: variant, error } = await supabase
            .from('product_variants')
            .insert([{ ...validatedData, product_id: productId }])
            .select()
            .single();

        if (error) throw error;
        return variant as ProductVariant;
    },

    async updateProductVariant(variantId: string, updates: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify user owns the parent product
        const role = await getUserRole(user.id);
        const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('product_id')
            .eq('id', variantId)
            .single();

        if (!existingVariant) throw new Error('Variant not found');

        const { data: product } = await supabase
            .from('products')
            .select('seller_id, artisan_id')
            .eq('id', existingVariant.product_id)
            .single();

        if (!product || (product.seller_id !== user.id && product.artisan_id !== user.id && role !== 'admin')) {
            throw new Error('Not authorized');
        }

        const { error } = await supabase
            .from('product_variants')
            .update(updates)
            .eq('id', variantId);

        if (error) throw error;
    },

    async deleteProductVariant(variantId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify user owns the parent product
        const role = await getUserRole(user.id);
        const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('product_id')
            .eq('id', variantId)
            .single();

        if (!existingVariant) throw new Error('Variant not found');

        const { data: product } = await supabase
            .from('products')
            .select('seller_id, artisan_id')
            .eq('id', existingVariant.product_id)
            .single();

        if (!product || (product.seller_id !== user.id && product.artisan_id !== user.id && role !== 'admin')) {
            throw new Error('Not authorized');
        }

        const { error } = await supabase
            .from('product_variants')
            .delete()
            .eq('id', variantId);

        if (error) throw error;
    }
};
