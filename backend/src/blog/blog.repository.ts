import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BlogPost,
  BlogPostSummary,
  BlogSubmission,
  BlogTag,
  EmailNotificationPayload,
  GetBlogPostsFilter,
  GetBlogSubmissionsFilter,
  InsertBlogPostPayload,
  InsertBlogPostTagRow,
  InsertBlogSubmissionPayload,
  InsertNotificationPayload,
  RawBlogPostRow,
  UpdateBlogPostPayload,
} from './types/blog.types';

@Injectable()
export class BlogRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return (data as { role?: string } | null)?.role;
  }

  async getSlugs(seed: string): Promise<string[]> {
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
    return ((data as unknown as Array<{ slug: string }>) || []).map(
      (r) => r.slug,
    );
  }

  async getBlogPosts(
    filters: GetBlogPostsFilter,
    limit: number,
    offset: number,
    userRole: string,
    requestUserId?: string,
  ): Promise<{ data: RawBlogPostRow[]; count: number }> {
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
    return {
      data: (data as unknown as RawBlogPostRow[]) ?? [],
      count: count ?? 0,
    };
  }

  async getFeaturedBlogPosts(limit: number): Promise<BlogPostSummary[]> {
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
    return (data as unknown as BlogPostSummary[]) || [];
  }

  async getBlogPostBySlug(slug: string): Promise<RawBlogPostRow | null> {
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
    return (data as unknown as RawBlogPostRow) || null;
  }

  async incrementBlogViews(postId: string): Promise<void> {
    try {
      await this.client.rpc('increment_blog_views', { p_post_id: postId });
    } catch (error) {
      console.error('Failed to increment blog views:', postId, error);
    }
  }

  async getRelatedPosts(
    postId: string,
    category: string | null,
    limit: number,
  ): Promise<BlogPostSummary[]> {
    const cleanCategory =
      category && category.trim() !== '' ? category.trim() : null;
    const isUuid =
      typeof postId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        postId,
      );

    if (isUuid) {
      try {
        const res = await this.client.rpc('get_related_posts', {
          p_post_id: postId,
          p_category: cleanCategory,
          p_limit: limit,
        });

        if (!res.error && res.data) return res.data as BlogPostSummary[];
        if (res.error) {
          console.warn('get_related_posts RPC warning:', res.error.message);
        }
      } catch (err: unknown) {
        console.warn(
          'get_related_posts RPC failed, using fallback query:',
          err,
        );
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

    return (data as unknown as BlogPostSummary[]) || [];
  }

  async insertBlogPost(postData: InsertBlogPostPayload): Promise<BlogPost> {
    const { data, error } = await this.client
      .from('blog_posts')
      .insert([postData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as BlogPost;
  }

  async insertBlogPostTags(rows: InsertBlogPostTagRow[]): Promise<void> {
    const { error } = await this.client.from('blog_post_tags').insert(rows);
    if (error) throw new Error(error.message);
  }

  async getBlogPostById(
    id: string,
  ): Promise<{ author_id: string; status: string; slug: string } | null> {
    const { data } = await this.client
      .from('blog_posts')
      .select('author_id, status, slug')
      .eq('id', id)
      .single();
    return (
      (data as unknown as {
        author_id: string;
        status: string;
        slug: string;
      } | null) || null
    );
  }

  async updateBlogPost(
    id: string,
    updates: UpdateBlogPostPayload,
  ): Promise<BlogPost> {
    const { data, error } = await this.client
      .from('blog_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as BlogPost;
  }

  async deleteBlogPostTags(postId: string): Promise<void> {
    await this.client.from('blog_post_tags').delete().eq('post_id', postId);
  }

  async deleteBlogPost(id: string): Promise<void> {
    const { error } = await this.client
      .from('blog_posts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getBlogTags(): Promise<BlogTag[]> {
    const { data, error } = await this.client
      .from('blog_tags')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as BlogTag[]) || [];
  }

  async insertBlogTag(tagData: {
    name: string;
    slug: string;
  }): Promise<BlogTag> {
    const { data, error } = await this.client
      .from('blog_tags')
      .insert([tagData])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as BlogTag;
  }

  async deleteBlogTag(id: string): Promise<void> {
    const { error } = await this.client.from('blog_tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async insertSingleBlogPostTag(postId: string, tagId: string): Promise<void> {
    const { error } = await this.client
      .from('blog_post_tags')
      .insert([{ post_id: postId, tag_id: tagId }]);
    if (error) throw new Error(error.message);
  }

  async deleteSingleBlogPostTag(postId: string, tagId: string): Promise<void> {
    const { error } = await this.client
      .from('blog_post_tags')
      .delete()
      .eq('post_id', postId)
      .eq('tag_id', tagId);
    if (error) throw new Error(error.message);
  }

  async checkBlogSubmissionLimit(
    userId: string,
    limit: number,
  ): Promise<boolean | null> {
    const res = await this.client.rpc('check_blog_submission_limit', {
      p_user_id: userId,
      p_limit: limit,
    });
    if (res.error) throw new Error(res.error.message);
    return res.data as boolean | null;
  }

  async insertBlogSubmission(
    submissionData: InsertBlogSubmissionPayload,
  ): Promise<BlogSubmission> {
    const { data, error } = await this.client
      .from('blog_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as BlogSubmission;
  }

  async getBlogSubmissions(
    filters?: GetBlogSubmissionsFilter,
  ): Promise<BlogSubmission[]> {
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
    return (data as unknown as BlogSubmission[]) || [];
  }

  async getUserBlogSubmissions(userId: string): Promise<BlogSubmission[]> {
    const { data, error } = await this.client
      .from('blog_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as unknown as BlogSubmission[]) || [];
  }

  async getBlogSubmissionById(id: string): Promise<BlogSubmission | null> {
    const { data } = await this.client
      .from('blog_submissions')
      .select('*')
      .eq('id', id)
      .single();
    return (data as unknown as BlogSubmission) || null;
  }

  async updateBlogSubmissionStatus(
    id: string,
    status: string,
    currentStatus: string,
    extraUpdates: Record<string, unknown> = {},
  ): Promise<Array<{ id: string }> | null> {
    const { data, error } = await this.client
      .from('blog_submissions')
      .update({ ...extraUpdates, status })
      .eq('id', id)
      .eq('status', currentStatus)
      .select('id');

    if (error) throw new Error(error.message);
    return data || null;
  }

  async getProfileForNotification(
    userId: string,
  ): Promise<{ email: string | null; full_name: string | null } | null> {
    const { data } = await this.client
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    return data || null;
  }

  async insertNotification(
    notificationData: InsertNotificationPayload,
  ): Promise<void> {
    try {
      await this.client.from('notifications').insert(notificationData);
    } catch (error) {
      console.error('Failed to insert notification:', error);
    }
  }

  async invokeEmailFunction(payload: EmailNotificationPayload): Promise<void> {
    await this.client.functions
      .invoke('send-email', { body: payload })
      .catch(console.error);
  }
}
