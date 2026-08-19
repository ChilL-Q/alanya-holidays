import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductOrderDto } from './dto/create-product-order.dto';
import { GetShopCatalogQueryDto } from './dto/get-shop-catalog-query.dto';

export interface ProductCategoryRow {
  id: number;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface ProductItemRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  status: string;
  media: Array<{ url: string; type: string }> | null;
  category_id: number | null;
  product_categories: { id?: number; name: string } | null;
  variant_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProductSkuRow {
  id: number;
  product_id: number;
  label: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  created_at?: string;
}

export interface ProductDetailResult {
  product: ProductItemRow | null;
  variants: unknown[];
  skus: ProductSkuRow[];
}

export interface ShopCatalogResult {
  products: ProductItemRow[];
  categories: ProductCategoryRow[];
}

export interface CreateOrderResult {
  success: boolean;
  orderId: number;
  message: string;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  private isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    );
  }

  async insertProduct(productData: Record<string, unknown>) {
    const { data, error } = await this.client
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getProducts(category?: string) {
    let query = this.client.from('products').select(`
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

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async getProductById(id: string) {
    if (!this.isValidUuid(id)) return null;

    const { data, error } = await this.client
      .from('products')
      .select(
        `
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
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async getUserRole(userId: string) {
    if (!this.isValidUuid(userId)) return null;

    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  async getProductOwnership(productId: string) {
    if (!this.isValidUuid(productId)) return null;

    const { data, error } = await this.client
      .from('products')
      .select('seller_id, artisan_id')
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async updateProduct(id: string, updates: Record<string, unknown>) {
    if (!this.isValidUuid(id)) return;

    const { error } = await this.client
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async deleteProduct(id: string) {
    if (!this.isValidUuid(id)) return;

    const { error } = await this.client.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getProductVariants(productId: string) {
    if (!this.isValidUuid(productId)) return [];

    const { data, error } = await this.client
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') return [];
      throw new Error(error.message);
    }
    return data ?? [];
  }

  async insertProductVariant(variantData: Record<string, unknown>) {
    const { data, error } = await this.client
      .from('product_variants')
      .insert([variantData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getVariantProductId(variantId: string): Promise<string | null> {
    if (!this.isValidUuid(variantId)) return null;

    const { data } = await this.client
      .from('product_variants')
      .select('product_id')
      .eq('id', variantId)
      .single();
    return (data?.product_id as string | undefined) ?? null;
  }

  async updateProductVariant(
    variantId: string,
    updates: Record<string, unknown>,
  ) {
    if (!this.isValidUuid(variantId)) return;

    const { error } = await this.client
      .from('product_variants')
      .update(updates)
      .eq('id', variantId);
    if (error) throw new Error(error.message);
  }

  async deleteProductVariant(variantId: string) {
    if (!this.isValidUuid(variantId)) return;

    const { error } = await this.client
      .from('product_variants')
      .delete()
      .eq('id', variantId);
    if (error) throw new Error(error.message);
  }

  // --- Shop Catalog & Orders System ---

  async getFeaturedProducts(limit = 8): Promise<ProductItemRow[]> {
    try {
      const { data, error } = await this.client
        .from('product_items')
        .select(
          'id, name, description, price, currency, stock, media, category_id, status, created_at, product_categories(id, name)',
        )
        .eq('status', 'active')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as unknown as ProductItemRow[]) ?? [];
    } catch {
      return [];
    }
  }

  async getShopCategories(): Promise<ProductCategoryRow[]> {
    const { data, error } = await this.client
      .from('product_categories')
      .select('id, name, sort_order, created_at')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getShopCatalog(
    query?: GetShopCatalogQueryDto,
  ): Promise<ShopCatalogResult> {
    let productsQuery = this.client
      .from('product_items')
      .select(
        'id, name, description, price, currency, stock, media, category_id, status, created_at, product_categories(id, name)',
      )
      .eq('status', 'active');

    if (query?.category) {
      const categoryNum = Number(query.category);
      if (!Number.isNaN(categoryNum)) {
        productsQuery = productsQuery.eq('category_id', categoryNum);
      }
    }

    const [productsRes, categoriesRes, variantsRes] = await Promise.all([
      productsQuery.order('created_at', { ascending: true }),
      this.getShopCategories(),
      this.client
        .from('product_variants')
        .select('id, product_id, size_label, price, stock, sku'),
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);

    const variantCounts: Record<string | number, number> = {};
    if (variantsRes.data) {
      for (const v of variantsRes.data as Array<{
        product_id: string | number;
      }>) {
        variantCounts[v.product_id] = (variantCounts[v.product_id] || 0) + 1;
      }
    }

    const rawProducts = (productsRes.data as unknown as ProductItemRow[]) || [];
    const products = rawProducts.map((p) => ({
      ...p,
      variant_count: variantCounts[p.id] || undefined,
    }));

    return {
      products,
      categories: categoriesRes,
    };
  }

  async getShopProductDetails(
    productId: string | number,
  ): Promise<ProductDetailResult> {
    const numId = Number(productId);
    const [productRes, variantRes, skuRes] = await Promise.all([
      this.client
        .from('product_items')
        .select(
          'id, name, description, price, currency, stock, media, category_id, status, created_at, product_categories(id, name)',
        )
        .eq('id', Number.isNaN(numId) ? productId : numId)
        .maybeSingle(),
      this.client
        .from('product_variants')
        .select('id, product_id, size_label, price, stock, sku')
        .eq('product_id', String(productId)),
      this.client
        .from('product_skus')
        .select('id, product_id, label, options, price, stock')
        .eq('product_id', Number.isNaN(numId) ? productId : numId)
        .order('id', { ascending: true }),
    ]);

    if (productRes.error) throw new Error(productRes.error.message);

    return {
      product: (productRes.data as unknown as ProductItemRow) || null,
      variants: variantRes.data || [],
      skus: (skuRes.data as ProductSkuRow[]) || [],
    };
  }

  async createProductOrder(
    dto: CreateProductOrderDto,
    userId?: string,
  ): Promise<CreateOrderResult> {
    const { data: orderData, error: orderError } = await this.client
      .from('order_headers')
      .insert({
        currency: dto.currency,
        payment_provider: 'manual',
        status: 'pending_payment',
        subtotal_items: dto.subtotal,
        customer_notes: dto.customerNotes || null,
        customer_id: userId && this.isValidUuid(userId) ? userId : null,
        recipient: dto.recipient,
      })
      .select('id')
      .single();

    if (orderError || !orderData) {
      throw new Error(orderError?.message || 'Failed to create order');
    }

    const orderId = Number(orderData.id);

    const orderItems = dto.items.map((item) => ({
      order_id: String(orderId),
      product_id: String(item.productId),
      product_name: item.productName,
      sku_id: item.skuId != null ? String(item.skuId) : null,
      sku_label: item.skuLabel || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      final_price: item.finalPrice,
      subtotal: item.subtotal,
    }));

    const { error: itemError } = await this.client
      .from('order_items')
      .insert(orderItems);

    if (itemError) throw new Error(itemError.message);

    return {
      success: true,
      orderId,
      message: 'Order placed successfully',
    };
  }
}
