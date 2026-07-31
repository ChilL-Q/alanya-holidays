import { UserProfile } from './common';

export interface ProductVariant {
    id: string;
    product_id: string;
    size_label: string;
    price: number;
    stock: number;
    sku: string | null;
    created_at: string;
}

export interface Product {
    id?: string;
    title: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    seller_id: string;
    images: string[];
    variants?: ProductVariant[];

    seller?: Partial<UserProfile>;
    created_at?: string;
}
