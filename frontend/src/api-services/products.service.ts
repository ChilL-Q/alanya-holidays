import { apiClient, isAbortError, type RequestOptions } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { ordersService } from "./orders.service";

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
  display_name: "Community member";
  category: string;
  submitted_at: string;
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

export interface SellerProduct {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  stock: number;
  status: "active" | "inactive" | "draft" | string;
  media?: Array<{ url: string; type: string }> | null;
  category_id?: number | null;
  seller_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type SellerProductDraft = Partial<Omit<SellerProduct, "id">>;

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
      throw new Error("Invalid shop catalog response");
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn("Failed to fetch shop catalog via API:", err);
      throw err;
    }
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
        const product = response.product || null;
        if (product?.status && product.status !== "active") {
          return { product: null, variants: [], skus: [] };
        }
        return {
          product,
          variants: Array.isArray(response.variants) ? response.variants : [],
          skus: Array.isArray(response.skus) ? response.skus : [],
        };
      }
      throw new Error("Invalid product details response");
    } catch (err: unknown) {
      if (isAbortError(err)) throw err;
      logger.warn(`Failed to fetch product details for ${productId} via API:`, err);
      throw err;
    }
  }

  /**
   * Places an order for a product/variant.
   * Delegates to ordersService.createOrder — the single POST /products/orders path.
   */
  async createProductOrder(payload: CreateProductOrderPayload): Promise<CreateProductOrderResult> {
    return ordersService.createOrder({
      currency: payload.currency,
      subtotal: payload.subtotal,
      customerNotes: payload.customerNotes ?? undefined,
      recipient: payload.recipient,
      items: payload.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        skuId: item.skuId ?? null,
        skuLabel: item.skuLabel ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        finalPrice: item.finalPrice,
        subtotal: item.subtotal,
      })),
    });
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

  /**
   * Fetches sellable catalog items owned by the current seller.
   * Dispatches GET /products/mine via apiClient.
   */
  async getMyProducts(options?: RequestOptions): Promise<SellerProduct[]> {
    const response = await apiClient.get<SellerProduct[] | { data: SellerProduct[] }>(
      "/products/mine",
      options
    );
    if (Array.isArray(response)) return response;
    if (response && typeof response === "object" && "data" in response && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  /**
   * Creates a new catalog product owned by the current seller.
   * Dispatches POST /products/mine via apiClient.
   */
  async createMyProduct(draft: SellerProductDraft): Promise<SellerProduct> {
    return apiClient.post<SellerProduct>("/products/mine", draft);
  }

  /**
   * Updates an own catalog product. Scoped by ownership on the backend.
   * Dispatches PATCH /products/mine/:id via apiClient.
   */
  async updateMyProduct(id: number, updates: SellerProductDraft): Promise<SellerProduct> {
    return apiClient.patch<SellerProduct>(`/products/mine/${id}`, updates);
  }

  async deleteMyProduct(id: number): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/products/mine/${id}`);
  }
}

export const productsService = new ProductsService();
