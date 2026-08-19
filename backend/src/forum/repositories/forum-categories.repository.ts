import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  ForumCategory,
  InsertForumCategoryDbInput,
  UpdateForumCategoryDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumCategoriesRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getCategories(): Promise<ForumCategory[]> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();
    return (data as unknown as ForumCategory) ?? null;
  }

  async getCategoryById(id: string): Promise<ForumCategory | null> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('id', id)
      .single();
    return (data as unknown as ForumCategory) ?? null;
  }

  async getCategoriesByIds(ids: string[]): Promise<ForumCategory[]> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getChildCategories(parentId: string): Promise<ForumCategory[]> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });
    return (data as unknown as ForumCategory[]) || [];
  }

  async insertCategory(
    data: InsertForumCategoryDbInput,
  ): Promise<ForumCategory> {
    const { data: cat, error } = await this.client
      .from('forum_categories')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return cat as unknown as ForumCategory;
  }

  async updateCategory(
    id: string,
    updates: UpdateForumCategoryDbInput,
  ): Promise<ForumCategory> {
    const { data, error } = await this.client
      .from('forum_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as ForumCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_categories')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return (data as { role?: string } | null)?.role;
  }

  async getPostCategoryCounts(): Promise<
    Array<{ category_id: string | null }>
  > {
    const { data } = await this.client
      .from('forum_posts')
      .select('category_id')
      .eq('is_removed', false);
    return data || [];
  }
}
