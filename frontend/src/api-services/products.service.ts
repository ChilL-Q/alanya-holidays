import { apiClient, isAbortError, type RequestOptions } from "@/lib/api-client";
import { logger } from "@/lib/logger";

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
  options: Record<string, string> | string[];
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
  async getFeaturedProducts(options?: RequestOptions): Promise<ShopProduct[]> {
    try {
      const response = options
        ? await apiClient.get<ShopProduct[]>("/products/featured", options)
        : await apiClient.get<ShopProduct[]>("/products/featured");
      if (Array.isArray(response) && response.length > 0) {
        return response;
      }
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      try {
        const response = await apiClient.get<ShopProduct[]>("/products", {
          ...options,
          params: { ...options?.params, featured: true },
        });
        if (Array.isArray(response) && response.length > 0) {
          return response;
        }
      } catch (innerErr: unknown) {
        if (isAbortError(innerErr)) throw innerErr;
        logger.warn("Failed to fetch featured products via API:", innerErr);
      }
    }

    return [];
  }

  /**
   * Fetches catalog products and categories for the shop page.
   */
  async getShopCatalog(options?: RequestOptions): Promise<ShopCatalogResponse> {
    try {
      const response = options
        ? await apiClient.get<ShopCatalogResponse>("/products/catalog", options)
        : await apiClient.get<ShopCatalogResponse>("/products/catalog");
      if (response && Array.isArray(response.products) && Array.isArray(response.categories)) {
        return response;
      }
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn("Failed to fetch shop catalog via API:", err);
    }

    return { products: [], categories: [] };
  }

  /**
   * Fetches active product categories.
   */
  async getProductCategories(options?: RequestOptions): Promise<ProductCategory[]> {
    try {
      const response = options
        ? await apiClient.get<ProductCategory[]>("/products/categories", options)
        : await apiClient.get<ProductCategory[]>("/products/categories");
      if (Array.isArray(response)) {
        return response;
      }
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn("Failed to fetch product categories via API:", err);
    }

    return [];
  }

  /**
   * Fetches single product details with variants and SKUs.
   */
  async getProductDetails(
    productId: number | string,
    options?: RequestOptions
  ): Promise<ProductDetailResponse> {
    try {
      const response = options
        ? await apiClient.get<ProductDetailResponse>(`/products/items/${productId}`, options)
        : await apiClient.get<ProductDetailResponse>(`/products/items/${productId}`);
      if (response) {
        return {
          product: response.product || null,
          variants: Array.isArray(response.variants) ? response.variants : [],
          skus: Array.isArray(response.skus) ? response.skus : [],
        };
      }
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn(`Failed to fetch product details for ${productId} via API:`, err);
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
      logger.error("Failed to create product order via API:", err);
      throw err;
    }
  }

  /**
   * Fetches recent concierge enquiries for sidebar feeds.
   */
  async getRecentEnquiries(limit: number = 8, options?: RequestOptions): Promise<ConciergeEnquiryEntry[]> {
    try {
      const response = await apiClient.get<ConciergeEnquiryEntry[]>("/enquiries/recent", {
        ...options,
        params: { ...options?.params, limit },
      });
      if (Array.isArray(response)) {
        return response;
      }
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn("Failed to fetch recent enquiries via API:", err);
    }

    return [];
  }
}

export const productsService = new ProductsService();
