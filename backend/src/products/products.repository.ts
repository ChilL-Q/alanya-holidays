import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  private isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  async insertProduct(productData: any) {
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

  async updateProduct(id: string, updates: any) {
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

  async insertProductVariant(variantData: any) {
    const { data, error } = await this.client
      .from('product_variants')
      .insert([variantData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getVariantProductId(variantId: string) {
    if (!this.isValidUuid(variantId)) return null;

    const { data } = await this.client
      .from('product_variants')
      .select('product_id')
      .eq('id', variantId)
      .single();
    return data?.product_id;
  }

  async updateProductVariant(variantId: string, updates: any) {
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
}
