import { apiClient } from "@/lib/api-client";

export interface ProductCategory {
  id: number;
  name: string;
  sort_order?: number;
}

export interface ProductMedia {
  url: string;
  type: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  media: ProductMedia[];
  category_id: number | null;
  product_categories: { id?: number; name: string } | null;
  variant_count?: number;
  status?: string;
  created_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  options: string[];
  sort_order?: number;
}

export interface ProductSku {
  id: number;
  product_id: number;
  label: string;
  options: Record<string, string>;
  price: number;
  stock: number;
}

export interface ProductDetail extends ShopProduct {
  product_categories: { id: number; name: string } | null;
}

export interface CreateProductOrderPayload {
  currency: string;
  subtotal: number;
  customerNotes?: string | null;
  recipient: {
    name: string;
    email: string;
    phone: string;
    contact_method: "whatsapp" | "phone_call" | "email";
  };
  items: Array<{
    productId: string | number;
    productName: string;
    skuId?: string | null;
    skuLabel?: string | null;
    quantity: number;
    unitPrice: number;
    finalPrice: number;
    subtotal: number;
  }>;
}

export interface CreateProductOrderResult {
  success: boolean;
  orderId: number | string;
  message?: string;
}

export interface ConciergeEnquiryEntry {
  id: number;
  name: string;
  email: string;
  subject?: string | null;
  phone?: string | null;
  service_type?: string | null;
  enquiry_type?: string | null;
  dates?: string | null;
  duration?: string | null;
  party_size?: number | null;
  created_at: string;
}

export interface ShopCatalogResponse {
  products: ShopProduct[];
  categories: ProductCategory[];
}

export interface ProductDetailResponse {
  product: ProductDetail | null;
  variants: ProductVariant[];
  skus: ProductSku[];
}

class ProductsService {
  /**
   * Fetches featured products and bestsellers for homepage/showcase.
   */
  async getFeaturedProducts(): Promise<ShopProduct[]> {
    try {
      const response = await apiClient.get<ShopProduct[]>("/products/featured");
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
    } catch {
      try {
        const response = await apiClient.get<ShopProduct[]>("/products", {
          params: { featured: true },
        });
        if (Array.isArray(response) && response.length > 0) {
          return response;
        }
      } catch (err: unknown) {
        console.warn("Failed to fetch featured products via API:", err);
      }
    }

    return [];
  }

  /**
   * Fetches catalog products and categories for the shop page.
   */
  async getShopCatalog(): Promise<ShopCatalogResponse> {
    try {
      const response = await apiClient.get<ShopCatalogResponse>("/products/catalog");
      if (response && Array.isArray(response.products) && Array.isArray(response.categories)) {
        return response;
      }
    } catch (err: unknown) {
      console.warn("Failed to fetch shop catalog via API:", err);
    }

    return { products: [], categories: [] };
  }

  /**
   * Fetches active product categories.
   */
  async getProductCategories(): Promise<ProductCategory[]> {
    try {
      const response = await apiClient.get<ProductCategory[]>("/products/categories");
      if (Array.isArray(response)) {
        return response;
      }
    } catch (err: unknown) {
      console.warn("Failed to fetch product categories via API:", err);
    }

    return [];
  }

  /**
   * Fetches single product details with variants and SKUs.
   */
  async getProductDetails(productId: number | string): Promise<ProductDetailResponse> {
    try {
      const response = await apiClient.get<ProductDetailResponse>(
        `/products/items/${productId}`
      );
      if (response) {
        return {
          product: response.product || null,
          variants: Array.isArray(response.variants) ? response.variants : [],
          skus: Array.isArray(response.skus) ? response.skus : [],
        };
      }
    } catch (err: unknown) {
      console.warn(`Failed to fetch product details for ${productId} via API:`, err);
    }

    return { product: null, variants: [], skus: [] };
  }

  /**
   * Places an order for a product/variant.
   */
  async createProductOrder(payload: CreateProductOrderPayload): Promise<CreateProductOrderResult> {
    try {
      const response = await apiClient.post<CreateProductOrderResult>(
        "/products/orders",
        payload
      );
      return response;
    } catch (err: unknown) {
      console.error("Failed to create product order via API:", err);
      throw err;
    }
  }

  /**
   * Fetches recent concierge enquiries for sidebar feeds.
   */
  async getRecentEnquiries(limit: number = 8): Promise<ConciergeEnquiryEntry[]> {
    try {
      const response = await apiClient.get<ConciergeEnquiryEntry[]>("/enquiries/recent", {
        params: { limit },
      });
      if (Array.isArray(response)) {
        return response;
      }
    } catch (err: unknown) {
      console.warn("Failed to fetch recent enquiries via API:", err);
    }

    return [];
  }
}

export const productsService = new ProductsService();
