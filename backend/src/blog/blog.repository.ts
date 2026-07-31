import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BlogRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getUserRole(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return data?.role;
  }

  async getSlugs(seed: string) {
    const escapePostgREST = (value: string) =>
      value
        .replace(/%/g, '\\%')
        .replace(/\./g, '\\.')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
    const { data, error } = await this.client
      .from('blog_posts')
      .select('slug')
      .eq('slug', seed)
      .or(`slug.like.${escapePostgREST(seed)}-%`);
    if (error) throw new Error(error.message);
    return data.map((r) => r.slug);
  }

  async getBlogPosts(
    filters: any,
    limit: number,
    offset: number,
    userRole: string,
    requestUserId?: string,
  ) {
    let query = this.client
      .from('blog_posts')
      .select(
        `*, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url), tags:blog_post_tags(tag:blog_tags(id, name, slug))`,
        { count: 'exact' },
      );

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else if (
      userRole !== 'admin' &&
      !(requestUserId && filters.authorId === requestUserId)
    ) {
      query = query.eq('status', 'published');
    }

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.is_featured === 'true') query = query.eq('is_featured', true);
    if (filters.authorId) query = query.eq('author_id', filters.authorId);
    if (filters.search) {
      const safe = filters.search
        .trim()
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/,/g, ' ');
      if (safe)
        query = query.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
    }

    const { data, error, count } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);
    return { data: data ?? [], count: count ?? 0 };
  }

  async getFeaturedBlogPosts(limit: number) {
    const { data, error } = await this.client
      .from('blog_posts')
      .select(
        `id, title, slug, excerpt, cover_image_url, category, published_at, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)`,
      )
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBlogPostBySlug(slug: string) {
    const { data, error } = await this.client
      .from('blog_posts')
      .select(
        `*, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url), tags:blog_post_tags(tag:blog_tags(id, name, slug))`,
      )
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data;
  }

  async incrementBlogViews(postId: string) {
    try {
      await this.client.rpc('increment_blog_views', { p_post_id: postId });
    } catch (error) {
      console.error('Failed to increment blog views:', postId, error);
    }
  }

  async getRelatedPosts(postId: string, category: string, limit: number) {
    const cleanCategory =
      category && category.trim() !== '' ? category.trim() : null;
    const isUuid =
      typeof postId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        postId,
      );

    if (isUuid) {
      try {
        const { data, error } = await this.client.rpc('get_related_posts', {
          p_post_id: postId,
          p_category: cleanCategory,
          p_limit: limit,
        });

        if (!error && data) return data;
        if (error) {
          console.warn('get_related_posts RPC warning:', error.message);
        }
      } catch (err) {
        console.warn('get_related_posts RPC failed, using fallback query:', err);
      }
    }

    let query = this.client
      .from('blog_posts')
      .select(
        'id, title, slug, excerpt, cover_image_url, category, published_at, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)',
      )
      .eq('status', 'published');

    if (isUuid) {
      query = query.neq('id', postId);
    }
    if (cleanCategory) {
      query = query.eq('category', cleanCategory);
    }

    const { data } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    return data || [];
  }

  async insertBlogPost(postData: any) {
    const { data, error } = await this.client
      .from('blog_posts')
      .insert([postData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async insertBlogPostTags(rows: any[]) {
    const { error } = await this.client.from('blog_post_tags').insert(rows);
    if (error) throw new Error(error.message);
  }

  async getBlogPostById(id: string) {
    const { data } = await this.client
      .from('blog_posts')
      .select('author_id, status, slug')
      .eq('id', id)
      .single();
    return data;
  }

  async updateBlogPost(id: string, updates: any) {
    const { data, error } = await this.client
      .from('blog_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBlogPostTags(postId: string) {
    await this.client.from('blog_post_tags').delete().eq('post_id', postId);
  }

  async deleteBlogPost(id: string) {
    const { error } = await this.client
      .from('blog_posts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getBlogTags() {
    const { data, error } = await this.client
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async insertBlogTag(tagData: any) {
    const { data, error } = await this.client
      .from('blog_tags')
      .insert([tagData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBlogTag(id: string) {
    const { error } = await this.client.from('blog_tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async insertSingleBlogPostTag(postId: string, tagId: string) {
    const { error } = await this.client
      .from('blog_post_tags')
      .insert([{ post_id: postId, tag_id: tagId }]);
    if (error) throw new Error(error.message);
  }

  async deleteSingleBlogPostTag(postId: string, tagId: string) {
    const { error } = await this.client
      .from('blog_post_tags')
      .delete()
      .eq('post_id', postId)
      .eq('tag_id', tagId);
    if (error) throw new Error(error.message);
  }

  async checkBlogSubmissionLimit(userId: string, limit: number) {
    const { data, error } = await this.client.rpc(
      'check_blog_submission_limit',
      { p_user_id: userId, p_limit: limit },
    );
    if (error) throw new Error(error.message);
    return data;
  }

  async insertBlogSubmission(submissionData: any) {
    const { data, error } = await this.client
      .from('blog_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getBlogSubmissions(filters: any) {
    let query = this.client
      .from('blog_submissions')
      .select(
        `*, user:profiles!blog_submissions_user_id_fkey(full_name, email)`,
      )
      .order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getUserBlogSubmissions(userId: string) {
    const { data, error } = await this.client
      .from('blog_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getBlogSubmissionById(id: string) {
    const { data } = await this.client
      .from('blog_submissions')
      .select('*')
      .eq('id', id)
      .single();
    return data;
  }

  async updateBlogSubmissionStatus(
    id: string,
    status: string,
    currentStatus: string,
    extraUpdates: any = {},
  ) {
    const { data, error } = await this.client
      .from('blog_submissions')
      .update({ status, ...extraUpdates })
      .eq('id', id)
      .eq('status', currentStatus)
      .select('id');

    if (error) throw new Error(error.message);
    return data;
  }

  async getProfileForNotification(userId: string) {
    const { data } = await this.client
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    return data;
  }

  async insertNotification(notificationData: any) {
    try {
      await this.client.from('notifications').insert(notificationData);
    } catch (error) {
      console.error('Failed to insert notification:', error);
    }
  }

  async invokeEmailFunction(payload: any) {
    await this.client.functions
      .invoke('send-email', { body: payload })
      .catch(console.error);
  }
}
