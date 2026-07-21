import { Product } from '../../types/index';
import { productSchema, productVariantSchema } from './schemas';
import { supabase } from '../supabase';

export interface ProductVariant {
    id: string;
    product_id: string;
    size_label: string;
    price: number;
    stock: number;
    sku: string | null;
    created_at: string;
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

export const productsService = {
    async createProduct(data: Product) {
        const validatedData = productSchema.parse(data);
        const headers = await getAuthHeaders();
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData)
        });
        if (!res.ok) throw new Error('Failed to create product');
        return res.json() as Promise<Product>;
    },

    async getProducts(category?: string) {
        const query = category ? `?category=${encodeURIComponent(category)}` : '';
        const res = await fetch(`/api/products${query}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json() as Promise<Product[]>;
    },
    
    async getProduct(id: string) {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            if (res.status === 404) throw new Error('Product not found');
            throw new Error('Failed to fetch product');
        }
        return res.json() as Promise<Product>;
    },

    async updateProduct(id: string, updates: Partial<Product>) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update product');
    },

    async deleteProduct(id: string) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to delete product');
    },

    // ============================================================
    // Product Variants CRUD
    // ============================================================

    async getProductVariants(productId: string) {
        const res = await fetch(`/api/products/${productId}/variants`);
        if (!res.ok) throw new Error('Failed to fetch variants');
        return res.json() as Promise<ProductVariant[]>;
    },

    async createProductVariant(productId: string, data: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>) {
        const validatedData = productVariantSchema.parse(data);
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products/${productId}/variants`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(validatedData)
        });
        if (!res.ok) throw new Error('Failed to create variant');
        return res.json() as Promise<ProductVariant>;
    },

    async updateProductVariant(variantId: string, updates: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>>) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products/variants/${variantId}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update variant');
    },

    async deleteProductVariant(variantId: string) {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/products/variants/${variantId}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Failed to delete variant');
    }
};
