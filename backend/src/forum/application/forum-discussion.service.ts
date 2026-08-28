import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import {
  assertAuthorOrAdmin,
  assertAdmin,
} from '../domain/forum-authorization.helper';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from '../dto/forum-categories.dto';
import { CreateForumPostDto, UpdateForumPostDto } from '../dto/forum-posts.dto';
import {
  ForumActionResponse,
  ForumCategory,
  ForumComment,
  ForumCommentsFilter,
  ForumLikeResponse,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsFilter,
  ForumPostsRepoFilter,
  ForumStatsResponse,
  UpdateForumCategoryDbInput,
  UpdateForumPostDbInput,
} from '../types/forum.types';

@Injectable()
export class ForumDiscussionService {
  private readonly logger = new Logger(ForumDiscussionService.name);

  constructor(
    private readonly forumRepository: ForumRepository,
    @Optional() private readonly userRolesRepo?: UserRolesRepository,
  ) {}

  private async requireAdmin(userId: string): Promise<void> {
    const role = await this.userRolesRepo?.getRole(userId);
    assertAdmin(role);
  }

  private async resolveSlug(baseSlug: string): Promise<string> {
    const seed = slugify(baseSlug) || 'post';
    const existingSlugs = await this.forumRepository.getPostSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  private async annotateLikes<T extends { id: string; liked_by_me?: boolean }>(
    rows: T[],
    table: 'forum_post_likes' | 'forum_comment_likes',
    fkColumn: 'post_id' | 'comment_id',
    userId?: string,
  ): Promise<T[]> {
    if (typeof this.forumRepository.annotateLikes === 'function') {
      return this.forumRepository.annotateLikes(rows, table, fkColumn, userId);
    }
    if (!userId || rows.length === 0)
      return rows.map((r) => ({ ...r, liked_by_me: false }));
    const ids = rows.map((r) => r.id);
    const data =
      table === 'forum_post_likes'
        ? await this.forumRepository.getPostLikes(userId, ids)
        : await this.forumRepository.getCommentLikes(userId, ids);
    const liked = new Set(
      (data || []).map((row) =>
        String((row as Record<string, unknown>)[fkColumn]),
      ),
    );
    return rows.map((r) => ({ ...r, liked_by_me: liked.has(String(r.id)) }));
  }

  private async attachCategoryParents(posts: ForumPost[]): Promise<void> {
    if (typeof this.forumRepository.attachCategoryParents === 'function') {
      return this.forumRepository.attachCategoryParents(posts);
    }
    const missingParentIds = Array.from(
      new Set(
        posts
          .filter(
            (p) =>
              p.category?.parent_id &&
              (!p.category.parent || !('name' in p.category.parent)),
          )
          .map((p) => String(p.category?.parent_id)),
      ),
    );
    if (missingParentIds.length === 0) return;

    const data =
      await this.forumRepository.getCategoriesByIds(missingParentIds);
    const map = new Map<string, ForumCategory>(
      (data || []).map((c) => [String(c.id), c]),
    );
    for (const p of posts) {
      if (
        p.category?.parent_id &&
        (!p.category.parent || !('name' in p.category.parent))
      )
        p.category.parent = map.get(String(p.category.parent_id)) || null;
    }
  }

  private async postCountsByCategory(): Promise<Map<string, number>> {
    if (typeof this.forumRepository.postCountsByCategory === 'function') {
      return this.forumRepository.postCountsByCategory();
    }
    const data = await this.forumRepository.getPostCategoryCounts();
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
  // Categories
  // ============================================================
  async getForumCategories(): Promise<ForumCategory[]> {
    return this.forumRepository.getCategories();
  }

  async getForumCategoryTree(): Promise<ForumCategory[]> {
    const [all, counts] = await Promise.all([
      this.forumRepository.getCategories(),
      this.postCountsByCategory(),
    ]);

    const childrenByParent = new Map<string, ForumCategory[]>();
    for (const c of all) {
      if (c.parent_id) {
        const arr = childrenByParent.get(String(c.parent_id)) || [];
        arr.push(c);
        childrenByParent.set(String(c.parent_id), arr);
      }
    }

    return all
      .filter((c) => !c.parent_id)
      .map((parent) => {
        const children: ForumCategory[] = (
          childrenByParent.get(String(parent.id)) || []
        ).map((ch) => ({
          ...ch,
          discussion_count: counts.get(String(ch.id)) || 0,
        }));
        const discussion = children.reduce(
          (sum: number, ch) => sum + (ch.discussion_count || 0),
          counts.get(String(parent.id)) || 0,
        );
        return {
          ...parent,
          children,
          topic_count: children.length,
          discussion_count: discussion,
        };
      });
  }

  async getForumCategory(slugOrId: string): Promise<ForumCategory | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      );
    const category = isUuid
      ? await this.forumRepository.getCategoryById(slugOrId)
      : await this.forumRepository.getCategoryBySlug(slugOrId);
    if (!category) return null;

    const counts = await this.postCountsByCategory();

    if (category.parent_id) {
      const parent = await this.forumRepository.getCategoryById(
        category.parent_id,
      );
      category.parent = parent || null;
      category.discussion_count = counts.get(String(category.id)) || 0;
    } else {
      const kids = await this.forumRepository.getChildCategories(category.id);
      const children = (kids || []).map((ch) => ({
        ...ch,
        discussion_count: counts.get(String(ch.id)) || 0,
      }));
      category.children = children;
      category.topic_count = children.length;
      category.discussion_count = children.reduce(
        (sum, ch) => sum + (ch.discussion_count || 0),
        counts.get(String(category.id)) || 0,
      );
    }

    return category;
  }

  async createForumCategory(
    input: CreateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    await this.requireAdmin(userId);
    return this.forumRepository.insertCategory({
      name: input.name,
      slug: slugify(input.name) || 'category',
      description: input.description || null,
      sort_order: input.sort_order ?? 0,
      parent_id: input.parent_id || null,
      icon: input.icon || null,
      image_url: input.image_url || null,
      accent: input.accent || null,
    });
  }

  async updateForumCategory(
    id: string,
    updates: UpdateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    await this.requireAdmin(userId);
    const safe: UpdateForumCategoryDbInput = {};
    if (updates.name !== undefined) {
      safe.name = updates.name;
      safe.slug = slugify(updates.name) || 'category';
    }
    if (updates.description !== undefined)
      safe.description = updates.description || null;
    if (updates.sort_order !== undefined) safe.sort_order = updates.sort_order;
    if (updates.parent_id !== undefined)
      safe.parent_id = updates.parent_id || null;
    if (updates.icon !== undefined) safe.icon = updates.icon || null;
    if (updates.image_url !== undefined)
      safe.image_url = updates.image_url || null;
    if (updates.accent !== undefined) safe.accent = updates.accent || null;

    return this.forumRepository.updateCategory(id, safe);
  }

  async deleteForumCategory(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    await this.forumRepository.deleteCategory(id);
    return { success: true };
  }

  // ============================================================
  // Posts
  // ============================================================
  async getForumPosts(
    filters: ForumPostsFilter,
    userId?: string,
  ): Promise<ForumPaginatedResult<ForumPost>> {
    if (filters.removedOnly && filters.includeRemoved)
      throw new BadRequestException(
        'Cannot specify both removedOnly and includeRemoved',
      );

    const limit =
      Number.isFinite(filters.limit) && (filters.limit as number) > 0
        ? Math.min(filters.limit as number, 100)
        : 20;
    const offset =
      Number.isFinite(filters.offset) && (filters.offset as number) >= 0
        ? (filters.offset as number)
        : 0;

    let categoryIds: string[] | undefined = undefined;

    if (filters.categorySlug) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          filters.categorySlug,
        );
      const cat = isUuid
        ? await this.forumRepository.getCategoryById(filters.categorySlug)
        : await this.forumRepository.getCategoryBySlug(filters.categorySlug);
      if (!cat) return { data: [], total: 0 };
      if (cat.parent_id) {
        categoryIds = [cat.id];
      } else {
        const kids = await this.forumRepository.getChildCategories(cat.id);
        categoryIds = [
          String(cat.id),
          ...(kids || []).map((k) => String(k.id)),
        ];
      }
    }

    const filtersForRepo: ForumPostsRepoFilter = { ...filters, categoryIds };
    const { data, total } = await this.forumRepository.getPosts(
      filtersForRepo,
      limit,
      offset,
    );

    const annotated = await this.annotateLikes(
      data,
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents(annotated);
    return { data: annotated, total: total || 0 };
  }

  async getHotPosts(limit = 8, userId?: string): Promise<ForumPost[]> {
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 8;
    const data = await this.forumRepository.getHotPosts(safeLimit);
    const hot = await this.annotateLikes(
      data,
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents(hot);
    return hot;
  }

  async getForumPost(
    slugOrId: string,
    userId?: string,
  ): Promise<ForumPost | null> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      );
    const data = isUuid
      ? await this.forumRepository.getPostById(slugOrId)
      : await this.forumRepository.getPostBySlug(slugOrId);
    if (!data) return null;

    if (data.is_removed) {
      const role = userId
        ? await this.userRolesRepo?.getRole(userId)
        : undefined;
      if (role !== 'admin' && data.author_id !== userId) {
        return null;
      }
    }

    const [annotated] = await this.annotateLikes(
      [data],
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents([annotated]);
    return annotated ?? null;
  }

  async createForumPost(
    input: CreateForumPostDto,
    postType: 'discussion' | 'question',
    userId: string,
  ): Promise<ForumPost> {
    if (typeof this.forumRepository.checkRateLimit === 'function') {
      const allowed = await this.forumRepository.checkRateLimit(
        userId,
        'post',
        5,
      );
      if (!allowed) {
        throw new HttpException(
          'Превышен лимит создания постов (максимум 5 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    let resolvedCategoryId: string | null = null;
    if (input.category_id) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          input.category_id,
        );
      if (isUuid) {
        resolvedCategoryId = input.category_id;
      } else {
        const cat = await this.forumRepository.getCategoryBySlug(
          input.category_id,
        );
        resolvedCategoryId = cat ? cat.id : null;
      }

      if (input.subcategory && resolvedCategoryId) {
        const isSubUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            input.subcategory,
          );
        if (isSubUuid) {
          resolvedCategoryId = input.subcategory;
        } else {
          const childCategories =
            await this.forumRepository.getChildCategories(resolvedCategoryId);
          const subName = input.subcategory.trim().toLowerCase();
          const matchedChild = childCategories?.find(
            (c) =>
              c.id === input.subcategory ||
              c.slug.toLowerCase() === subName ||
              c.name.toLowerCase() === subName,
          );
          if (matchedChild) {
            resolvedCategoryId = matchedChild.id;
          }
        }
      }
    }

    const uniqueSlug = await this.resolveSlug(slugify(input.title));
    return this.forumRepository.insertPost({
      title: input.title,
      slug: uniqueSlug,
      body: input.body ?? input.content ?? '',
      content: input.content ?? input.body ?? '',
      category_id: resolvedCategoryId,
      image_url: input.image_url || null,
      author_id: userId,
      post_type: postType,
    });
  }

  async updateForumPost(
    id: string,
    updates: UpdateForumPostDto,
    userId: string,
  ): Promise<ForumPost> {
    const role = this.userRolesRepo
      ? await this.userRolesRepo.getRole(userId)
      : undefined;
    const existing = await this.forumRepository.getPostById(id);

    if (!existing) throw new NotFoundException('Post not found');
    assertAuthorOrAdmin(existing.author_id, userId, role);

    const safe: UpdateForumPostDbInput = {};
    if (updates.title !== undefined) safe.title = updates.title;
    if (updates.body !== undefined) safe.body = updates.body;
    if (updates.content !== undefined) safe.content = updates.content;
    if (updates.image_url !== undefined)
      safe.image_url = updates.image_url || null;
    if (updates.category_id !== undefined) {
      if (updates.category_id) {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            updates.category_id,
          );
        if (isUuid) {
          safe.category_id = updates.category_id;
        } else {
          const cat = await this.forumRepository.getCategoryBySlug(
            updates.category_id,
          );
          safe.category_id = cat ? cat.id : null;
        }

        if (updates.subcategory && safe.category_id) {
          const isSubUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              updates.subcategory,
            );
          if (isSubUuid) {
            safe.category_id = updates.subcategory;
          } else {
            const childCategories =
              await this.forumRepository.getChildCategories(safe.category_id);
            const subName = updates.subcategory.trim().toLowerCase();
            const matchedChild = childCategories?.find(
              (c) =>
                c.id === updates.subcategory ||
                c.slug.toLowerCase() === subName ||
                c.name.toLowerCase() === subName,
            );
            if (matchedChild) {
              safe.category_id = matchedChild.id;
            }
          }
        }
      } else {
        safe.category_id = null;
      }
    }

    return this.forumRepository.updatePost(id, safe);
  }

  async deleteForumPost(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    const role = this.userRolesRepo
      ? await this.userRolesRepo.getRole(userId)
      : undefined;
    const existing = await this.forumRepository.getPostById(id);
    if (!existing) throw new NotFoundException('Post not found');
    assertAuthorOrAdmin(existing.author_id, userId, role);

    await this.forumRepository.deletePost(id);
    return { success: true };
  }

  async incrementPostView(id: string): Promise<ForumActionResponse> {
    try {
      await this.forumRepository.incrementPostView(id);
    } catch (e) {
      this.logger.error(
        `Failed to increment post view for ${id}`,
        e instanceof Error ? e.stack : undefined,
      );
    }
    return { success: true };
  }

  async setPinned(
    id: string,
    pinned: boolean,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    await this.forumRepository.updatePostPinned(id, pinned);
    return { success: true };
  }

  async setRemoved(
    targetType: 'post' | 'comment',
    id: string,
    removed: boolean,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    const table = targetType === 'post' ? 'forum_posts' : 'forum_comments';
    await this.forumRepository.setRemoved(table, id, removed);
    return { success: true };
  }

  // ============================================================
  // Comments
  // ============================================================
  async getForumComments(
    postId: string,
    options: ForumCommentsFilter,
    userId?: string,
  ): Promise<ForumComment[]> {
    const data = await this.forumRepository.getComments(
      postId,
      !!options?.includeRemoved,
    );
    return this.annotateLikes(
      data,
      'forum_comment_likes',
      'comment_id',
      userId,
    );
  }

  async createForumComment(
    postId: string,
    body: string,
    userId: string,
    parentId?: string | null,
  ): Promise<ForumComment> {
    if (typeof this.forumRepository.checkRateLimit === 'function') {
      const allowed = await this.forumRepository.checkRateLimit(
        userId,
        'comment',
        20,
      );
      if (!allowed) {
        throw new HttpException(
          'Превышен лимит отправки комментариев (максимум 20 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return this.forumRepository.insertComment({
      post_id: postId,
      author_id: userId,
      body,
      content: body,
      parent_id: parentId || null,
    });
  }

  async updateForumComment(
    id: string,
    body: string,
    userId: string,
  ): Promise<ForumComment> {
    const role = this.userRolesRepo
      ? await this.userRolesRepo.getRole(userId)
      : undefined;
    const existing = await this.forumRepository.getCommentById(id);
    if (!existing) throw new NotFoundException('Comment not found');
    assertAuthorOrAdmin(existing.author_id, userId, role);

    return this.forumRepository.updateComment(id, { body, content: body });
  }

  async deleteForumComment(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    const role = this.userRolesRepo
      ? await this.userRolesRepo.getRole(userId)
      : undefined;
    const existing = await this.forumRepository.getCommentById(id);
    if (!existing) throw new NotFoundException('Comment not found');
    assertAuthorOrAdmin(existing.author_id, userId, role);

    await this.forumRepository.deleteComment(id);
    return { success: true };
  }

  async getRemovedComments(
    limit = 50,
    userId: string,
  ): Promise<ForumComment[]> {
    await this.requireAdmin(userId);
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;
    return this.forumRepository.getRemovedComments(safeLimit);
  }

  // ============================================================
  // Likes (Delegating to Repository Race-Safe Toggle Helper)
  // ============================================================
  async togglePostLike(
    postId: string,
    userId: string,
  ): Promise<ForumLikeResponse> {
    if (typeof this.forumRepository.checkRateLimit === 'function') {
      const allowed = await this.forumRepository.checkRateLimit(
        userId,
        'like',
        60,
      );
      if (!allowed) {
        throw new HttpException(
          'Превышен лимит лайков (максимум 60 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (typeof this.forumRepository.toggleRow === 'function') {
      const { active } = await this.forumRepository.toggleRow(
        'forum_post_likes',
        'post_id',
        postId,
        userId,
      );
      return { liked: active };
    }

    const existing = await this.forumRepository.checkPostLike(postId, userId);
    if (existing) {
      await this.forumRepository.deletePostLike(postId, userId);
      return { liked: false };
    }
    try {
      await this.forumRepository.insertPostLike(postId, userId);
      return { liked: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('23505') ||
        msg.includes('duplicate') ||
        msg.includes('unique')
      ) {
        return { liked: true };
      }
      throw err;
    }
  }

  async toggleCommentLike(
    commentId: string,
    userId: string,
  ): Promise<ForumLikeResponse> {
    if (typeof this.forumRepository.checkRateLimit === 'function') {
      const allowed = await this.forumRepository.checkRateLimit(
        userId,
        'like',
        60,
      );
      if (!allowed) {
        throw new HttpException(
          'Превышен лимит лайков (максимум 60 в час). Пожалуйста, попробуйте позже.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    if (typeof this.forumRepository.toggleRow === 'function') {
      const { active } = await this.forumRepository.toggleRow(
        'forum_comment_likes',
        'comment_id',
        commentId,
        userId,
      );
      return { liked: active };
    }

    const existing = await this.forumRepository.checkCommentLike(
      commentId,
      userId,
    );
    if (existing) {
      await this.forumRepository.deleteCommentLike(commentId, userId);
      return { liked: false };
    }
    try {
      await this.forumRepository.insertCommentLike(commentId, userId);
      return { liked: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('23505') ||
        msg.includes('duplicate') ||
        msg.includes('unique')
      ) {
        return { liked: true };
      }
      throw err;
    }
  }

  // ============================================================
  // Bookmarks
  // ============================================================
  async getUserBookmarks(userId: string): Promise<ForumPost[]> {
    const posts = await this.forumRepository.getUserBookmarks(userId);
    const annotated = await this.annotateLikes(
      posts,
      'forum_post_likes',
      'post_id',
      userId,
    );
    await this.attachCategoryParents(annotated);
    return annotated.map((p) => ({ ...p, bookmarked_by_me: true }));
  }

  async togglePostBookmark(
    postId: string,
    userId: string,
  ): Promise<{ bookmarked: boolean }> {
    const existingPost = await this.forumRepository.getPostById(postId);
    if (!existingPost) throw new NotFoundException('Post not found');

    if (typeof this.forumRepository.toggleRow === 'function') {
      const { active } = await this.forumRepository.toggleRow(
        'forum_bookmarks' as unknown as 'forum_post_likes',
        'post_id',
        postId,
        userId,
      );
      return { bookmarked: active };
    }

    const isBookmarked = await this.forumRepository.checkBookmark(
      postId,
      userId,
    );
    if (isBookmarked) {
      await this.forumRepository.deleteBookmark(postId, userId);
      return { bookmarked: false };
    }
    await this.forumRepository.insertBookmark(postId, userId);
    return { bookmarked: true };
  }

  // ============================================================
  // Stats
  // ============================================================
  async getForumStats(): Promise<ForumStatsResponse> {
    return this.forumRepository.getStats();
  }
}
