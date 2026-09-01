import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ForumCategory,
  ForumComment,
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsRepoFilter,
  ForumReport,
  ForumStatsResponse,
  InsertForumCategoryDbInput,
  InsertForumCommentDbInput,
  InsertForumEventDbInput,
  InsertForumEventRsvpDbInput,
  InsertForumPostDbInput,
  InsertForumReportDbInput,
  UpdateForumCategoryDbInput,
  UpdateForumEventDbInput,
  UpdateForumPostDbInput,
} from './types/forum.types';

const POST_SELECT = `
    *,
    category:forum_categories(id, name, slug, description, sort_order, parent_id, icon, image_url, accent, created_at, parent:forum_categories(id, name, slug, description, icon, image_url, accent)),
    author:profiles!forum_posts_author_id_fkey(full_name, avatar_url, bio, role, created_at)
`;

export const EVENT_SELECT = `
    *,
    host:profiles!forum_events_host_id_fkey(full_name, avatar_url),
    category:forum_categories!forum_events_category_id_fkey(id, name, slug)
`;

@Injectable()
export class ForumRepository {
  private readonly logger = new Logger(ForumRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  // ============================================================
  // SQL Projections & Annotation Helpers
  // ============================================================
  async annotateLikes<T extends { id: string; liked_by_me?: boolean }>(
    rows: T[],
    table: 'forum_post_likes' | 'forum_comment_likes',
    fkColumn: 'post_id' | 'comment_id',
    userId?: string,
  ): Promise<T[]> {
    if (!userId || rows.length === 0)
      return rows.map((r) => ({ ...r, liked_by_me: false }));
    const ids = rows.map((r) => r.id);
    const data =
      table === 'forum_post_likes'
        ? await this.getPostLikes(userId, ids)
        : await this.getCommentLikes(userId, ids);
    const liked = new Set(
      (data || []).map((row) =>
        String((row as Record<string, unknown>)[fkColumn]),
      ),
    );
    return rows.map((r) => ({ ...r, liked_by_me: liked.has(String(r.id)) }));
  }

  async annotateRsvp(
    rows: ForumEvent[],
    userId?: string,
  ): Promise<ForumEvent[]> {
    if (!userId || rows.length === 0)
      return rows.map((e) => ({ ...e, going_by_me: false }));
    const ids = rows.map((e) => e.id);
    const data = await this.getEventRsvps(userId, ids);
    const going = new Set(
      (data || []).map((r) => String((r as { event_id?: string }).event_id)),
    );
    return rows.map((e) => ({ ...e, going_by_me: going.has(String(e.id)) }));
  }

  async attachCategoryParents(posts: ForumPost[]): Promise<void> {
    const missingParentIds = Array.from(
      new Set(
        posts
          .filter(
            (p) =>
              p.category?.parent_id &&
              (!p.category.parent ||
                !('name' in p.category.parent) ||
                (Array.isArray(p.category.parent) &&
                  p.category.parent.length === 0)),
          )
          .map((p) => String(p.category?.parent_id)),
      ),
    );
    if (missingParentIds.length === 0) return;

    const data = await this.getCategoriesByIds(missingParentIds);
    const map = new Map<string, ForumCategory>(
      (data || []).map((c) => [String(c.id), c]),
    );
    for (const p of posts) {
      if (
        p.category?.parent_id &&
        (!p.category.parent ||
          !('name' in p.category.parent) ||
          (Array.isArray(p.category.parent) && p.category.parent.length === 0))
      )
        p.category.parent = map.get(String(p.category.parent_id)) || null;
    }
  }

  async postCountsByCategory(): Promise<Map<string, number>> {
    const data = await this.getPostCategoryCounts();
    const counts = new Map<string, number>();
    for (const row of data || []) {
      if (row.category_id)
        counts.set(
          String(row.category_id),
          (counts.get(String(row.category_id)) || 0) + 1,
        );
    }
    return counts;
  }

  // ============================================================
  // Generic Race-Safe Row Toggle Helper (Tolerance to PG 23505)
  // ============================================================
  async toggleRow(
    table: 'forum_post_likes' | 'forum_comment_likes' | 'forum_event_rsvps',
    fkColumn: 'post_id' | 'comment_id' | 'event_id',
    id: string,
    userId: string,
    extraData?: Record<string, unknown>,
  ): Promise<{ active: boolean }> {
    const { data: existing, error: checkErr } = await this.client
      .from(table)
      .select(fkColumn)
      .eq(fkColumn, id)
      .eq('user_id', userId)
      .single();

    if (checkErr && checkErr.code !== 'PGRST116') {
      this.logger.error(
        `toggleRow check error on ${table}: ${checkErr.message}`,
      );
    }

    if (existing) {
      const { error: delErr } = await this.client
        .from(table)
        .delete()
        .match({ [fkColumn]: id, user_id: userId });
      if (delErr) throw new Error(delErr.message);
      return { active: false };
    }

    try {
      const insertPayload: Record<string, unknown> = {
        [fkColumn]: id,
        user_id: userId,
        ...(extraData || {}),
      };
      const { error: insErr } = await this.client
        .from(table)
        .insert([insertPayload]);
      if (insErr) {
        if (
          insErr.code === '23505' ||
          insErr.message?.includes('23505') ||
          insErr.message?.includes('duplicate') ||
          insErr.message?.includes('unique')
        ) {
          return { active: true };
        }
        throw new Error(insErr.message);
      }
      return { active: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('23505') ||
        msg.includes('duplicate') ||
        msg.includes('unique')
      ) {
        return { active: true };
      }
      throw err;
    }
  }

  // ============================================================
  // User & Profiles
  // ============================================================
  async getProfilesByIds(userIds: string[]): Promise<ForumEventAttendee[]> {
    if (!userIds || userIds.length === 0) return [];
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    if (error) throw new Error(error.message);
    return data || [];
  }

  // ============================================================
  // Categories
  // ============================================================
  async getCategories(): Promise<ForumCategory[]> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getCategoryBySlug error: ${error.message}`);
    }
    return (data as unknown as ForumCategory) ?? null;
  }

  async getCategoryById(id: string): Promise<ForumCategory | null> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getCategoryById error: ${error.message}`);
    }
    return (data as unknown as ForumCategory) ?? null;
  }

  async getCategoriesByIds(ids: string[]): Promise<ForumCategory[]> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .in('id', ids);
    if (error) throw new Error(error.message);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getChildCategories(parentId: string): Promise<ForumCategory[]> {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
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

  async getPostCategoryCounts(): Promise<
    Array<{ category_id: string | null }>
  > {
    const { data, error } = await this.client
      .from('forum_posts')
      .select('category_id')
      .eq('is_removed', false);
    if (error) throw new Error(error.message);
    return data || [];
  }

  // ============================================================
  // Posts
  // ============================================================
  async getPosts(
    filters: ForumPostsRepoFilter,
    limit: number,
    offset: number,
    postSelect: string = POST_SELECT,
  ): Promise<ForumPaginatedResult<ForumPost>> {
    let q = this.client
      .from('forum_posts')
      .select(postSelect, { count: 'exact' });

    if (!filters.includeRemoved) {
      q = q.eq('is_removed', filters.removedOnly || false);
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      q = q.in('category_id', filters.categoryIds);
    }
    if (filters.authorId) {
      q = q.eq('author_id', filters.authorId);
    }
    if (filters.postType) {
      q = q.eq('post_type', filters.postType);
    }

    if (filters.search && filters.search.trim()) {
      q = q.ilike('title', `%${filters.search.trim()}%`);
    }
    if (filters.sort === 'popular') {
      q = q
        .order('is_pinned', { ascending: false })
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      q = q
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
    }

    const { data, count, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return {
      data: (data as unknown as ForumPost[]) ?? [],
      total: count ?? 0,
    };
  }

  async getHotPosts(
    limit: number,
    postSelect: string = POST_SELECT,
  ): Promise<ForumPost[]> {
    const { data, error } = await this.client
      .from('forum_posts')
      .select(postSelect)
      .eq('is_removed', false)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      this.logger.error(
        'getHotPosts error:',
        error instanceof Error ? error.stack : JSON.stringify(error),
      );
    }
    return (data as unknown as ForumPost[]) ?? [];
  }

  async getPostBySlug(
    slug: string,
    postSelect: string = POST_SELECT,
  ): Promise<ForumPost | null> {
    const { data, error } = await this.client
      .from('forum_posts')
      .select(postSelect)
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getPostBySlug error: ${error.message}`);
    }
    return (data as unknown as ForumPost) ?? null;
  }

  async getPostSlugs(seed: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('forum_posts')
      .select('slug')
      .ilike('slug', `${seed}%`);
    if (error) throw new Error(error.message);
    return (data || []).map((p) => String(p.slug));
  }

  async insertPost(data: InsertForumPostDbInput): Promise<ForumPost> {
    const payload: {
      title: string;
      slug: string;
      body: string;
      category_id: string | null;
      image_url: string | null;
      author_id: string;
      post_type: string;
    } = {
      title: data.title,
      slug: data.slug,
      body: data.body ?? data.content ?? '',
      category_id: data.category_id || null,
      image_url: data.image_url || null,
      author_id: data.author_id,
      post_type: data.post_type || 'discussion',
    };
    const { data: post, error } = await this.client
      .from('forum_posts')
      .insert([payload])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return post as unknown as ForumPost;
  }

  async getPostById(
    id: string,
    postSelect: string = POST_SELECT,
  ): Promise<ForumPost | null> {
    const { data, error } = await this.client
      .from('forum_posts')
      .select(postSelect)
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getPostById error: ${error.message}`);
    }
    return (data as unknown as ForumPost) ?? null;
  }

  async updatePost(
    id: string,
    updates: UpdateForumPostDbInput,
  ): Promise<ForumPost> {
    const payload: {
      title?: string;
      slug?: string;
      body?: string;
      category_id?: string | null;
      image_url?: string | null;
      is_pinned?: boolean;
      is_removed?: boolean;
    } = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.body !== undefined || updates.content !== undefined) {
      payload.body = updates.body ?? updates.content;
    }
    if (updates.category_id !== undefined) {
      payload.category_id = updates.category_id;
    }
    if (updates.image_url !== undefined) {
      payload.image_url = updates.image_url;
    }
    if (updates.is_pinned !== undefined) {
      payload.is_pinned = updates.is_pinned;
    }
    if (updates.is_removed !== undefined) {
      payload.is_removed = updates.is_removed;
    }

    const { data, error } = await this.client
      .from('forum_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as ForumPost;
  }

  async deletePost(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_posts')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async incrementPostView(id: string): Promise<void> {
    const { error } = await this.client.rpc('increment_forum_post_view', {
      p_post_id: id,
    });
    if (error) {
      this.logger.error(`incrementPostView RPC error: ${error.message}`);
    }
  }

  async updatePostPinned(id: string, pinned: boolean): Promise<void> {
    const { error } = await this.client
      .from('forum_posts')
      .update({ is_pinned: pinned })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async setRemoved(
    table: 'forum_posts' | 'forum_comments',
    id: string,
    removed: boolean,
  ): Promise<void> {
    const { error } = await this.client
      .from(table)
      .update({ is_removed: removed })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ============================================================
  // Comments
  // ============================================================
  async updateComment(
    id: string,
    updates: { body?: string; content?: string },
  ): Promise<ForumComment> {
    const payload: { body?: string } = {};
    if (updates.body !== undefined || updates.content !== undefined) {
      payload.body = updates.body ?? updates.content;
    }
    const { data: comment, error } = await this.client
      .from('forum_comments')
      .update(payload)
      .eq('id', id)
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)',
      )
      .single();
    if (error) throw new Error(error.message);
    return comment as unknown as ForumComment;
  }

  async getComments(
    postId: string,
    includeRemoved: boolean,
    limit: number,
    offset: number,
  ): Promise<ForumComment[]> {
    let q = this.client
      .from('forum_comments')
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)',
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });

    if (!includeRemoved) {
      q = q.eq('is_removed', false);
    }
    const { data, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data as unknown as ForumComment[]) || [];
  }

  async insertComment(data: InsertForumCommentDbInput): Promise<ForumComment> {
    const payload: {
      post_id: string;
      author_id: string;
      body: string;
      parent_id: string | null;
    } = {
      post_id: data.post_id,
      author_id: data.author_id,
      body: data.body ?? data.content ?? '',
      parent_id: data.parent_id || null,
    };
    const { data: comment, error } = await this.client
      .from('forum_comments')
      .insert([payload])
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)',
      )
      .single();
    if (error) throw new Error(error.message);
    return comment as unknown as ForumComment;
  }

  async getCommentById(id: string): Promise<ForumComment | null> {
    const { data, error } = await this.client
      .from('forum_comments')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getCommentById error: ${error.message}`);
    }
    return (data as unknown as ForumComment) ?? null;
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_comments')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getRemovedComments(limit: number): Promise<ForumComment[]> {
    const { data, error } = await this.client
      .from('forum_comments')
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url), post:forum_posts(title, slug)',
      )
      .eq('is_removed', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as unknown as ForumComment[]) || [];
  }

  // ============================================================
  // Likes
  // ============================================================
  async checkPostLike(
    postId: string,
    userId: string,
  ): Promise<{ post_id: string } | null> {
    const { data, error } = await this.client
      .from('forum_post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`checkPostLike error: ${error.message}`);
    }
    return data ?? null;
  }

  async insertPostLike(postId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_post_likes')
      .insert([{ post_id: postId, user_id: userId }]);
    if (error) throw new Error(error.message);
  }

  async deletePostLike(postId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_post_likes')
      .delete()
      .match({ post_id: postId, user_id: userId });
    if (error) throw new Error(error.message);
  }

  async checkCommentLike(
    commentId: string,
    userId: string,
  ): Promise<{ comment_id: string } | null> {
    const { data, error } = await this.client
      .from('forum_comment_likes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`checkCommentLike error: ${error.message}`);
    }
    return data ?? null;
  }

  async insertCommentLike(commentId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_comment_likes')
      .insert([{ comment_id: commentId, user_id: userId }]);
    if (error) throw new Error(error.message);
  }

  async deleteCommentLike(commentId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_comment_likes')
      .delete()
      .match({ comment_id: commentId, user_id: userId });
    if (error) throw new Error(error.message);
  }

  async getPostLikes(
    userId: string,
    ids: string[],
  ): Promise<Array<{ post_id: string }> | null> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await this.client
      .from('forum_post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', ids);
    if (error) {
      this.logger.error(`getPostLikes error: ${error.message}`);
      return [];
    }
    return data ?? null;
  }

  async getCommentLikes(
    userId: string,
    ids: string[],
  ): Promise<Array<{ comment_id: string }> | null> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await this.client
      .from('forum_comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', ids);
    if (error) {
      this.logger.error(`getCommentLikes error: ${error.message}`);
      return [];
    }
    return data ?? null;
  }

  // ============================================================
  // Events
  // ============================================================
  async getEvents(
    filters: ForumEventsFilter,
    eventSelect: string = EVENT_SELECT,
  ): Promise<ForumEvent[]> {
    let q = this.client.from('forum_events').select(eventSelect);

    if (!filters.includeUnpublished) q = q.eq('is_published', true);
    if (filters.upcomingOnly) q = q.gte('event_date', new Date().toISOString());
    if (filters.search && filters.search.trim()) {
      q = q.ilike('title', `%${filters.search.trim()}%`);
    }
    if (filters.ownerId) {
      q = q.or(
        `host_id.eq.${filters.ownerId},created_by.eq.${filters.ownerId}`,
      );
    }

    const { data, error } = await q
      .order('event_date', { ascending: true })
      .limit(filters.limit || 20);

    if (error) throw new Error(error.message);
    return (data as unknown as ForumEvent[]) || [];
  }

  async getEventBySlug(
    slug: string,
    eventSelect: string = EVENT_SELECT,
  ): Promise<ForumEvent | null> {
    const { data, error } = await this.client
      .from('forum_events')
      .select(eventSelect)
      .eq('slug', slug)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`getEventBySlug error: ${error.message}`);
    }
    return (data as unknown as ForumEvent) ?? null;
  }

  async getEventSlugs(seed: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('forum_events')
      .select('slug')
      .ilike('slug', `${seed}%`);
    if (error) throw new Error(error.message);
    return (data || []).map((e) => String(e.slug));
  }

  async getEventOwnership(id: string): Promise<{
    host_id: string | null;
    created_by: string | null;
    is_published: boolean;
  } | null> {
    const { data, error } = await this.client
      .from('forum_events')
      .select('host_id, created_by, is_published')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  async insertEvent(data: InsertForumEventDbInput): Promise<ForumEvent> {
    const { data: event, error } = await this.client
      .from('forum_events')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return event as unknown as ForumEvent;
  }

  async updateEvent(
    id: string,
    updates: UpdateForumEventDbInput,
    merchantOwnerId?: string,
  ): Promise<ForumEvent | null> {
    let query = this.client.from('forum_events').update(updates).eq('id', id);
    if (merchantOwnerId) {
      query = query
        .eq('is_published', false)
        .or(`host_id.eq.${merchantOwnerId},created_by.eq.${merchantOwnerId}`);
    }
    const { data, error } = await query.select().maybeSingle();
    if (error) throw new Error(error.message);
    return (data as unknown as ForumEvent) ?? null;
  }

  async deleteEvent(id: string, merchantOwnerId?: string): Promise<boolean> {
    let query = this.client.from('forum_events').delete().eq('id', id);
    if (merchantOwnerId) {
      query = query
        .eq('is_published', false)
        .or(`host_id.eq.${merchantOwnerId},created_by.eq.${merchantOwnerId}`);
    }
    const { data, error } = await query.select('id').maybeSingle();
    if (error) throw new Error(error.message);
    return data !== null;
  }

  async getEventRsvpAttendees(
    eventId: string,
  ): Promise<
    Array<{ user_id: string; contact_phone: string | null; created_at: string }>
  > {
    const { data, error } = await this.client
      .from('forum_event_rsvps')
      .select('user_id, contact_phone, created_at')
      .eq('event_id', eventId);
    if (error) throw new Error(error.message);
    return data || [];
  }

  async checkEventRsvp(
    eventId: string,
    userId: string,
  ): Promise<{ event_id: string } | null> {
    const { data, error } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`checkEventRsvp error: ${error.message}`);
    }
    return data ?? null;
  }

  async insertEventRsvp(data: InsertForumEventRsvpDbInput): Promise<void> {
    const { error } = await this.client
      .from('forum_event_rsvps')
      .insert([data]);
    if (error) throw new Error(error.message);
  }

  async deleteEventRsvp(eventId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_event_rsvps')
      .delete()
      .match({ event_id: eventId, user_id: userId });
    if (error) throw new Error(error.message);
  }

  async getEventRsvps(
    userId: string,
    ids: string[],
  ): Promise<Array<{ event_id: string }> | null> {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await this.client
      .from('forum_event_rsvps')
      .select('event_id')
      .eq('user_id', userId)
      .in('event_id', ids);
    if (error) {
      this.logger.error(`getEventRsvps error: ${error.message}`);
      return [];
    }
    return data ?? null;
  }

  // ============================================================
  // Reports
  // ============================================================
  async insertReport(data: InsertForumReportDbInput): Promise<void> {
    const { error } = await this.client.from('forum_reports').insert([data]);
    if (error) throw new Error(error.message);
  }

  async getReports(
    options?:
      | {
          includeResolved?: boolean;
          page?: number;
          limit?: number;
          target_type?: 'post' | 'comment';
        }
      | boolean,
  ): Promise<ForumReport[]> {
    let q = this.client
      .from('forum_reports')
      .select(
        '*, reporter:profiles!forum_reports_reporter_id_fkey(full_name, avatar_url)',
      )
      .order('created_at', { ascending: false });

    const includeResolved =
      typeof options === 'boolean'
        ? options
        : options?.includeResolved === true;

    if (!includeResolved) {
      q = q.eq('resolved', false);
    }

    if (typeof options === 'object' && options !== null) {
      if (options.target_type) {
        q = q.eq('target_type', options.target_type);
      }
    }

    const limit =
      typeof options === 'object' &&
      options?.limit !== undefined &&
      options.limit > 0
        ? options.limit
        : 50;
    const page =
      typeof options === 'object' && options?.page && options.page > 0
        ? options.page
        : 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    q = q.range(from, to);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const reports = (data as unknown as ForumReport[]) || [];

    const postIds = Array.from(
      new Set(
        reports
          .filter(
            (report) =>
              report.target_type === 'post' && Boolean(report.target_id),
          )
          .map((report) => report.target_id),
      ),
    );
    const commentIds = Array.from(
      new Set(
        reports
          .filter(
            (report) =>
              report.target_type === 'comment' && Boolean(report.target_id),
          )
          .map((report) => report.target_id),
      ),
    );

    const [postsResult, commentsResult] = await Promise.all([
      postIds.length > 0
        ? this.client
            .from('forum_posts')
            .select(
              'id, title, content:body, author_id, is_pinned, is_removed, created_at',
            )
            .in('id', postIds)
        : Promise.resolve({ data: [], error: null }),
      commentIds.length > 0
        ? this.client
            .from('forum_comments')
            .select('id, post_id, body, author_id, is_removed, created_at')
            .in('id', commentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (postsResult.error) throw new Error(postsResult.error.message);
    if (commentsResult.error) throw new Error(commentsResult.error.message);

    const postsById = new Map(
      ((postsResult.data ?? []) as ForumReport['target_post'][])
        .filter((post): post is NonNullable<ForumReport['target_post']> =>
          Boolean(post?.id),
        )
        .map((post) => [post.id, post]),
    );
    const commentsById = new Map(
      ((commentsResult.data ?? []) as ForumReport['target_comment'][])
        .filter(
          (comment): comment is NonNullable<ForumReport['target_comment']> =>
            Boolean(comment?.id),
        )
        .map((comment) => [
          comment.id,
          {
            ...comment,
            user_id: comment.user_id ?? comment.author_id,
          },
        ]),
    );

    return reports.map((report) => {
      if (report.target_type === 'post') {
        const target = postsById.get(report.target_id) ?? null;
        return {
          ...report,
          target_post: target,
          target_comment: null,
          target_missing: target === null,
        };
      }
      if (report.target_type === 'comment') {
        const target = commentsById.get(report.target_id) ?? null;
        return {
          ...report,
          target_post: null,
          target_comment: target,
          target_missing: target === null,
        };
      }
      return report;
    });
  }

  async updateReportResolved(id: string): Promise<void> {
    const { error } = await this.client
      .from('forum_reports')
      .update({ resolved: true })
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ============================================================
  // Bookmarks
  // ============================================================
  async checkBookmark(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('forum_bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') {
      this.logger.error(`checkBookmark error: ${error.message}`);
    }
    return !!data;
  }

  async insertBookmark(postId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_bookmarks')
      .insert([{ post_id: postId, user_id: userId }]);
    if (error) throw new Error(error.message);
  }

  async deleteBookmark(postId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('forum_bookmarks')
      .delete()
      .match({ post_id: postId, user_id: userId });
    if (error) throw new Error(error.message);
  }

  async getUserBookmarks(userId: string): Promise<ForumPost[]> {
    const { data: bookmarks, error: bmErr } = await this.client
      .from('forum_bookmarks')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bmErr) throw new Error(bmErr.message);
    if (!bookmarks || bookmarks.length === 0) return [];

    const postIds = (bookmarks as { post_id: string }[]).map((b) => b.post_id);
    const { data: posts, error: pErr } = await this.client
      .from('forum_posts')
      .select(POST_SELECT)
      .in('id', postIds)
      .eq('is_removed', false);

    if (pErr) throw new Error(pErr.message);
    if (!posts) return [];

    const postMap = new Map(
      (posts as unknown as ForumPost[]).map((p) => [p.id, p]),
    );
    return postIds
      .map((id) => postMap.get(id))
      .filter((p): p is ForumPost => !!p);
  }

  // ============================================================
  // Stats
  // ============================================================
  async getStats(): Promise<ForumStatsResponse> {
    const [topicsRes, repliesRes] = await Promise.all([
      this.client
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('is_removed', false),
      this.client
        .from('forum_comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_removed', false),
    ]);

    if (topicsRes.error)
      this.logger.error(
        `getStats topics query failed: ${topicsRes.error.message}`,
      );
    if (repliesRes.error)
      this.logger.error(
        `getStats replies query failed: ${repliesRes.error.message}`,
      );

    const ONLINE_WINDOW_MS = 5 * 60 * 1000;
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();

    const onlineRes = await this.client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('last_seen_at', since);
    if (onlineRes.error)
      this.logger.error(
        `getStats online count query failed: ${onlineRes.error.message}`,
      );

    const membersRes = await this.client
      .from('profiles')
      .select('full_name', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(1);
    if (membersRes.error)
      this.logger.error(
        `getStats latest member query failed: ${membersRes.error.message}`,
      );

    const memberData = membersRes.data;

    return {
      totalTopics: topicsRes.count ?? 0,
      totalReplies: repliesRes.count ?? 0,
      totalMembers: membersRes.count ?? 0,
      usersOnline: onlineRes.count ?? 0,
      latestMember: memberData?.[0]?.full_name || null,
    };
  }

  // ============================================================
  // Rate Limiting (Task 4.5)
  // ============================================================
  async checkRateLimit(
    userId: string,
    action: 'post' | 'comment' | 'like',
    limit: number,
  ): Promise<boolean> {
    try {
      const { data, error } = (await this.client.rpc('check_forum_rate_limit', {
        p_user_id: userId,
        p_action: action,
        p_limit: limit,
      })) as { data: boolean | null; error: { message: string } | null };

      if (error) {
        this.logger.warn(
          `Failed to check forum rate limit via RPC, falling back to allow: ${error.message}`,
        );
        return true;
      }

      return data === true;
    } catch (err: unknown) {
      this.logger.warn(
        `Error during check_forum_rate_limit RPC execution: ${err instanceof Error ? err.message : String(err)}`,
      );
      return true;
    }
  }
}
