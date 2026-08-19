import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  ForumCategory,
  ForumComment,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsRepoFilter,
  InsertForumCommentDbInput,
  InsertForumPostDbInput,
  UpdateForumPostDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumPostsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  get client() {
    return this.supabaseService.getClient();
  }

  async getPosts(
    filters: ForumPostsRepoFilter,
    limit: number,
    offset: number,
    postSelect: string,
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

    if (filters.search) {
      q = q.ilike('title', `%${filters.search}%`);
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

  async getHotPosts(limit: number, postSelect: string): Promise<ForumPost[]> {
    const { data, error } = await this.client
      .from('forum_posts')
      .select(postSelect)
      .eq('is_removed', false)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('getHotPosts error:', error);
    }
    return (data as unknown as ForumPost[]) ?? [];
  }

  async getPostBySlug(
    slug: string,
    postSelect: string,
  ): Promise<ForumPost | null> {
    const { data } = await this.client
      .from('forum_posts')
      .select(postSelect)
      .eq('slug', slug)
      .single();
    return (data as unknown as ForumPost) ?? null;
  }

  async getPostSlugs(seed: string): Promise<string[]> {
    const { data } = await this.client
      .from('forum_posts')
      .select('slug')
      .ilike('slug', `${seed}%`);
    return (data || []).map((p) => String(p.slug));
  }

  async insertPost(data: InsertForumPostDbInput): Promise<ForumPost> {
    const { data: post, error } = await this.client
      .from('forum_posts')
      .insert([data])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return post as unknown as ForumPost;
  }

  async getPostById(id: string): Promise<ForumPost | null> {
    const { data } = await this.client
      .from('forum_posts')
      .select('*')
      .eq('id', id)
      .single();
    return (data as unknown as ForumPost) ?? null;
  }

  async updatePost(
    id: string,
    updates: UpdateForumPostDbInput,
  ): Promise<ForumPost> {
    const { data, error } = await this.client
      .from('forum_posts')
      .update(updates)
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
    await this.client.rpc('increment_forum_post_view', { p_post_id: id });
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

  async getComments(
    postId: string,
    includeRemoved: boolean,
  ): Promise<ForumComment[]> {
    let q = this.client
      .from('forum_comments')
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)',
      )
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!includeRemoved) {
      q = q.eq('is_removed', false);
    }
    const { data } = await q;
    return (data as unknown as ForumComment[]) || [];
  }

  async insertComment(data: InsertForumCommentDbInput): Promise<ForumComment> {
    const { data: comment, error } = await this.client
      .from('forum_comments')
      .insert([data])
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)',
      )
      .single();
    if (error) throw new Error(error.message);
    return comment as unknown as ForumComment;
  }

  async getCommentById(id: string): Promise<ForumComment | null> {
    const { data } = await this.client
      .from('forum_comments')
      .select('*')
      .eq('id', id)
      .single();
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
    const { data } = await this.client
      .from('forum_comments')
      .select(
        '*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url), post:forum_posts(title, slug)',
      )
      .eq('is_removed', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    return (data as unknown as ForumComment[]) || [];
  }

  async checkPostLike(
    postId: string,
    userId: string,
  ): Promise<{ post_id: string } | null> {
    const { data } = await this.client
      .from('forum_post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    return data ?? null;
  }

  async insertPostLike(postId: string, userId: string): Promise<void> {
    await this.client
      .from('forum_post_likes')
      .insert([{ post_id: postId, user_id: userId }]);
  }

  async deletePostLike(postId: string, userId: string): Promise<void> {
    await this.client
      .from('forum_post_likes')
      .delete()
      .match({ post_id: postId, user_id: userId });
  }

  async checkCommentLike(
    commentId: string,
    userId: string,
  ): Promise<{ comment_id: string } | null> {
    const { data } = await this.client
      .from('forum_comment_likes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();
    return data ?? null;
  }

  async insertCommentLike(commentId: string, userId: string): Promise<void> {
    await this.client
      .from('forum_comment_likes')
      .insert([{ comment_id: commentId, user_id: userId }]);
  }

  async deleteCommentLike(commentId: string, userId: string): Promise<void> {
    await this.client
      .from('forum_comment_likes')
      .delete()
      .match({ comment_id: commentId, user_id: userId });
  }

  async getPostLikes(
    userId: string,
    ids: string[],
  ): Promise<Array<{ post_id: string }> | null> {
    const { data } = await this.client
      .from('forum_post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', ids);
    return data ?? null;
  }

  async getCommentLikes(
    userId: string,
    ids: string[],
  ): Promise<Array<{ comment_id: string }> | null> {
    const { data } = await this.client
      .from('forum_comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', ids);
    return data ?? null;
  }

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();
    return (data as unknown as ForumCategory) ?? null;
  }

  async getChildCategories(parentId: string): Promise<ForumCategory[]> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('parent_id', parentId);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getCategoriesByIds(ids: string[]): Promise<ForumCategory[]> {
    const { data } = await this.client
      .from('forum_categories')
      .select('*')
      .in('id', ids);
    return (data as unknown as ForumCategory[]) || [];
  }

  async getUserRole(userId: string): Promise<string | undefined> {
    const { data } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return (data as { role?: string } | null)?.role;
  }
}
