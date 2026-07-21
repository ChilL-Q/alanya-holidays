import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ForumCategoriesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getCategories() {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getCategoryBySlug(slug: string) {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();
    return data;
  }

  async getCategoryById(id: string) {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }

  async getCategoriesByIds(ids: string[]) {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getChildCategories(parentId: string) {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });
    return data || [];
  }

  async insertCategory(data: any) {
    const { data: cat, error } = await this.client
      .from('forum_categories')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return cat;
  }

  async updateCategory(id: string, updates: any) {
    const { data, error } = await this.client
      .from('forum_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCategory(id: string) {
    const { error } = await this.client
      .from('forum_categories')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  async getPostCategoryCounts() {
    const { data } = await this.client
      .from('forum_posts')
      .select('category_id')
      .eq('is_removed', false);
    return data || [];
  }
}
