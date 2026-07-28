import { Injectable, UnauthorizedException } from '@nestjs/common';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { ForumPostsRepository } from '../repositories/forum-posts.repository';

@Injectable()
export class ForumPostsService {
  constructor(private readonly forumPostsRepository: ForumPostsRepository) {}

  private async requireAdmin(userId: string) {
    const role = await this.forumPostsRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Not authorized');
  }

  private async resolveSlug(baseSlug: string): Promise<string> {
    const seed = baseSlug || 'post';
    const existingSlugs = await this.forumPostsRepository.getPostSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  private async attachCategoryParents(posts: any[]) {
    const missingParentIds = Array.from(
      new Set(
        posts
          .filter((p) => p.category?.parent_id && p.category.parent === undefined)
          .map((p) => p.category.parent_id),
      ),
    );
    if (missingParentIds.length === 0) return;

    const data = await this.forumPostsRepository.getCategoriesByIds(
      missingParentIds as string[],
    );
    const map = new Map((data || []).map((c) => [c.id, c]));
    for (const p of posts) {
      if (p.category?.parent_id && p.category.parent === undefined)
        p.category.parent = map.get(p.category.parent_id) || null;
    }
  }

  private POST_SELECT = `
      *,
      category:forum_categories(id, name, slug, description, sort_order, parent_id, icon, image_url, accent, created_at, parent:forum_categories(id, name, slug, description, icon, image_url, accent)),
      author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)
  `;

  private async annotateLikes(
    rows: any[],
    table: 'forum_post_likes' | 'forum_comment_likes',
    fkColumn: 'post_id' | 'comment_id',
    userId?: string,
  ) {
    if (!userId || rows.length === 0)
      return rows.map((r) => ({ ...r, liked_by_me: false }));
    const ids = rows.map((r) => r.id);
    const data =
      table === 'forum_post_likes'
        ? await this.forumPostsRepository.getPostLikes(userId, ids)
        : await this.forumPostsRepository.getCommentLikes(userId, ids);
    const liked = new Set((data || []).map((row: any) => row[fkColumn]));
    return rows.map((r) => ({ ...r, liked_by_me: liked.has(r.id) }));
  }

  // ============================================================
  // Posts
  // ============================================================
  async getForumPosts(filters: any, userId?: string) {
    if (filters.removedOnly && filters.includeRemoved)
      throw new Error('Cannot specify both removedOnly and includeRemoved');

    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;

    let categoryIds: string[] | undefined = undefined;

    if (filters.categorySlug) {
      const cat = await this.forumPostsRepository.getCategoryBySlug(
        filters.categorySlug,
      );
      if (!cat) return { data: [], total: 0 };
      if (cat.parent_id) {
        categoryIds = [cat.id];
      } else {
        const kids = await this.forumPostsRepository.getChildCategories(cat.id);
        categoryIds = [cat.id, ...(kids || []).map((k) => k.id)];
      }
    }

    const filtersForRepo = { ...filters, categoryIds };
    const { data, total } = await this.forumPostsRepository.getPosts(
      filtersForRepo,
      limit,
      offset,
      this.POST_SELECT,
    );

    const annotated = await this.annotateLikes(
      data || [],
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents(annotated);
    return { data: annotated, total };
  }

  async getHotPosts(limit = 8, userId?: string) {
    const data = await this.forumPostsRepository.getHotPosts(
      limit,
      this.POST_SELECT,
    );
    const hot = await this.annotateLikes(
      data || [],
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents(hot);
    return hot;
  }

  async getForumPost(slug: string, userId?: string) {
    const data = await this.forumPostsRepository.getPostBySlug(
      slug,
      this.POST_SELECT,
    );
    if (!data) return null;

    const [annotated] = await this.annotateLikes(
      [data],
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents([annotated]);
    return annotated;
  }

  async createForumPost(
    input: any,
    postType: 'discussion' | 'question',
    userId: string,
  ) {
    const uniqueSlug = await this.resolveSlug(slugify(input.title));
    return this.forumPostsRepository.insertPost({
      title: input.title,
      slug: uniqueSlug,
      body: input.body,
      category_id: input.category_id || null,
      author_id: userId,
      post_type: postType,
    });
  }

  async updateForumPost(id: string, updates: any, userId: string) {
    const role = await this.forumPostsRepository.getUserRole(userId);
    const existing = await this.forumPostsRepository.getPostById(id);

    if (!existing) throw new Error('Post not found');
    if (existing.author_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    const safe: any = {};
    if (updates.title !== undefined) safe.title = updates.title;
    if (updates.body !== undefined) safe.body = updates.body;
    if (updates.category_id !== undefined)
      safe.category_id = updates.category_id || null;

    return this.forumPostsRepository.updatePost(id, safe);
  }

  async deleteForumPost(id: string, userId: string) {
    const role = await this.forumPostsRepository.getUserRole(userId);
    const existing = await this.forumPostsRepository.getPostById(id);
    if (!existing) throw new Error('Post not found');
    if (existing.author_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    await this.forumPostsRepository.deletePost(id);
    return { success: true };
  }

  async incrementPostView(id: string) {
    try {
      await this.forumPostsRepository.incrementPostView(id);
    } catch (e) {
      console.error(e);
    }
    return { success: true };
  }

  async setPinned(id: string, pinned: boolean, userId: string) {
    await this.requireAdmin(userId);
    await this.forumPostsRepository.updatePostPinned(id, pinned);
    return { success: true };
  }

  async setRemoved(
    targetType: 'post' | 'comment',
    id: string,
    removed: boolean,
    userId: string,
  ) {
    await this.requireAdmin(userId);
    const table = targetType === 'post' ? 'forum_posts' : 'forum_comments';
    await this.forumPostsRepository.setRemoved(table, id, removed);
    return { success: true };
  }

  // ============================================================
  // Comments
  // ============================================================
  async getForumComments(
    postId: string,
    options: { includeRemoved?: boolean },
    userId?: string,
  ) {
    const data = await this.forumPostsRepository.getComments(
      postId,
      !!options?.includeRemoved,
    );
    return this.annotateLikes(
      data || [],
      'forum_comment_likes',
      'comment_id',
      userId,
    );
  }

  async createForumComment(postId: string, body: string, userId: string) {
    return this.forumPostsRepository.insertComment({
      post_id: postId,
      author_id: userId,
      body,
    });
  }

  async deleteForumComment(id: string, userId: string) {
    const role = await this.forumPostsRepository.getUserRole(userId);
    const existing = await this.forumPostsRepository.getCommentById(id);
    if (!existing) throw new Error('Comment not found');
    if (existing.author_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    await this.forumPostsRepository.deleteComment(id);
    return { success: true };
  }

  async getRemovedComments(limit = 50, userId: string) {
    await this.requireAdmin(userId);
    return this.forumPostsRepository.getRemovedComments(limit);
  }

  // ============================================================
  // Likes
  // ============================================================
  async togglePostLike(postId: string, userId: string) {
    const existing = await this.forumPostsRepository.checkPostLike(
      postId,
      userId,
    );
    if (existing) {
      await this.forumPostsRepository.deletePostLike(postId, userId);
      return { liked: false };
    }
    await this.forumPostsRepository.insertPostLike(postId, userId);
    return { liked: true };
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const existing = await this.forumPostsRepository.checkCommentLike(
      commentId,
      userId,
    );
    if (existing) {
      await this.forumPostsRepository.deleteCommentLike(commentId, userId);
      return { liked: false };
    }
    await this.forumPostsRepository.insertCommentLike(commentId, userId);
    return { liked: true };
  }
}
