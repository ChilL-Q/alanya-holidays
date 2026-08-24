import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import { ModerationAuditService } from '../admin/moderation-audit.service';
import { slugify, generateUniqueSlug } from '../utils/slugify';
import sanitizeHtml from 'sanitize-html';
import {
  BlogComment,
  BlogPost,
  BlogPostSummary,
  BlogPostsListResult,
  BlogSubmission,
  BlogTag,
  InsertBlogCommentPayload,
  SubmissionCreatedResponse,
  SuccessResponse,
  UpdateBlogPostPayload,
} from './types/blog.types';
import {
  CreateBlogCommentDto,
  CreateBlogPostDto,
  CreateBlogSubmissionDto,
  GetBlogQueryDto,
  GetBlogSubmissionsQueryDto,
  UpdateBlogPostDto,
} from './dto';

const generateExcerpt = (
  content: string | null,
  maxLength = 200,
): string | null => {
  if (!content) return null;
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trimEnd() + '\u2026';
};

@Injectable()
export class BlogService {
  constructor(
    private readonly blogRepository: BlogRepository,
    private readonly userRolesRepo: UserRolesRepository,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
  ) {}

  private async checkAdmin(userId: string): Promise<void> {
    const role = await this.userRolesRepo.getRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Admin only');
  }

  private async resolveSlug(baseSlug: string): Promise<string> {
    const seed = slugify(baseSlug) || 'post';
    const existingSlugs = await this.blogRepository.getSlugs(seed);
    return generateUniqueSlug(seed, existingSlugs);
  }

  async getBlogPosts(
    filters: GetBlogQueryDto,
    requestUserId?: string,
  ): Promise<BlogPostsListResult> {
    let role = 'anon';
    if (requestUserId) {
      const userRole = await this.userRolesRepo.getRole(requestUserId);
      if (userRole) role = userRole;
    }

    const limit = filters.limit ? Number(filters.limit) : 10;
    const page = filters.page ? Number(filters.page) : 1;
    const offset =
      filters.offset !== undefined
        ? Number(filters.offset)
        : (page - 1) * limit;

    const { data, count } = await this.blogRepository.getBlogPosts(
      filters,
      limit,
      offset,
      role,
      requestUserId,
    );

    const flattened: BlogPost[] = (data || []).map((post) => ({
      ...post,
      tags: (post.tags || [])
        .map((t) => t?.tag)
        .filter((tag): tag is BlogTag => Boolean(tag)),
    }));

    return { data: flattened, total: count || 0 };
  }

  async getFeaturedBlogPosts(limit = 3): Promise<BlogPostSummary[]> {
    return this.blogRepository.getFeaturedBlogPosts(limit);
  }

  async getBlogPost(
    slug: string,
    incrementViews = true,
    userId?: string,
  ): Promise<BlogPost> {
    const data = await this.blogRepository.getBlogPostBySlug(slug);
    if (!data) throw new NotFoundException('Blog post not found');

    if (data.status !== 'published') {
      const role = userId
        ? await this.userRolesRepo.getRole(userId)
        : undefined;
      if (role !== 'admin' && data.author_id !== userId) {
        throw new NotFoundException('Blog post not found');
      }
    }

    const result: BlogPost = {
      ...data,
      tags: (data.tags || [])
        .map((t) => t?.tag)
        .filter((tag): tag is BlogTag => Boolean(tag)),
    };

    if (incrementViews && result.status === 'published') {
      await this.blogRepository.incrementBlogViews(result.id);
    }
    return result;
  }

  async getRelatedPosts(
    postId: string,
    category: string,
    limit = 3,
  ): Promise<BlogPostSummary[]> {
    return this.blogRepository.getRelatedPosts(postId, category, limit);
  }

  async createBlogPost(
    data: CreateBlogPostDto,
    userId: string,
  ): Promise<BlogPost> {
    const role = await this.userRolesRepo.getRole(userId);

    const baseSlug = data.slug || slugify(data.title);
    const uniqueSlug = await this.resolveSlug(baseSlug);
    const excerpt = data.excerpt || generateExcerpt(data.content || null);
    const publishedAt =
      data.status === 'published' ? new Date().toISOString() : null;

    const post = await this.blogRepository.insertBlogPost({
      title: data.title,
      slug: uniqueSlug,
      content: data.content,
      excerpt,
      video_url: data.video_url || null,
      cover_image_url: data.cover_image_url || data.cover_image || null,
      author_id: userId,
      category: data.category || null,
      status: data.status || 'draft',
      is_featured: data.is_featured && role === 'admin' ? true : false,
      published_at: publishedAt,
    });

    const tagIds = data.tag_ids || data.tags;
    if (tagIds && tagIds.length > 0) {
      const tagRows = tagIds.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));
      await this.blogRepository.insertBlogPostTags(tagRows);
    }
    return post;
  }

  async updateBlogPost(
    id: string,
    updates: UpdateBlogPostDto,
    userId: string,
  ): Promise<BlogPost> {
    const { role, existing } = await this.checkPostOwnership(id, userId);

    const safe: UpdateBlogPostPayload = {};
    if (updates.title !== undefined) {
      safe.title = updates.title;
      if (!updates.slug)
        safe.slug = await this.resolveSlug(slugify(updates.title));
    }
    if (updates.slug !== undefined) safe.slug = updates.slug;
    if (updates.content !== undefined) safe.content = updates.content;
    if (updates.excerpt !== undefined) safe.excerpt = updates.excerpt;
    else if (updates.content !== undefined)
      safe.excerpt = generateExcerpt(updates.content);
    if (updates.video_url !== undefined)
      safe.video_url = updates.video_url || null;
    if (
      updates.cover_image_url !== undefined ||
      updates.cover_image !== undefined
    )
      safe.cover_image_url =
        updates.cover_image_url || updates.cover_image || null;
    if (updates.category !== undefined)
      safe.category = updates.category || null;
    if (updates.status !== undefined) {
      safe.status = updates.status;
      if (updates.status === 'published' && existing.status !== 'published') {
        safe.published_at = new Date().toISOString();
      }
    }
    if (updates.is_featured !== undefined && role === 'admin') {
      safe.is_featured = updates.is_featured;
    }

    const post = await this.blogRepository.updateBlogPost(id, safe);

    const tagIds =
      updates.tag_ids !== undefined ? updates.tag_ids : updates.tags;
    if (tagIds !== undefined) {
      await this.blogRepository.deleteBlogPostTags(id);
      if (tagIds.length > 0) {
        const tagRows = tagIds.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));
        await this.blogRepository.insertBlogPostTags(tagRows);
      }
    }
    return post;
  }

  async deleteBlogPost(id: string, userId: string): Promise<SuccessResponse> {
    await this.checkAdmin(userId);
    await this.blogRepository.deleteBlogPost(id);
    return { success: true };
  }

  // Tags
  async getBlogTags(): Promise<BlogTag[]> {
    return this.blogRepository.getBlogTags();
  }

  async createBlogTag(name: string, userId: string): Promise<BlogTag> {
    await this.checkAdmin(userId);
    return this.blogRepository.insertBlogTag({ name, slug: slugify(name) });
  }

  async deleteBlogTag(id: string, userId: string): Promise<SuccessResponse> {
    await this.checkAdmin(userId);
    await this.blogRepository.deleteBlogTag(id);
    return { success: true };
  }

  async addTagToPost(
    postId: string,
    tagId: string,
    userId: string,
  ): Promise<SuccessResponse> {
    await this.checkPostOwnership(postId, userId);
    await this.blogRepository.insertSingleBlogPostTag(postId, tagId);
    return { success: true };
  }

  async removeTagFromPost(
    postId: string,
    tagId: string,
    userId: string,
  ): Promise<SuccessResponse> {
    await this.checkPostOwnership(postId, userId);
    await this.blogRepository.deleteSingleBlogPostTag(postId, tagId);
    return { success: true };
  }

  private async checkPostOwnership(
    postId: string,
    userId: string,
  ): Promise<{
    role: string | undefined;
    existing: { author_id: string; status: string; slug: string };
  }> {
    const role = await this.userRolesRepo.getRole(userId);
    const existing = await this.blogRepository.getBlogPostById(postId);
    if (!existing) throw new NotFoundException('Blog post not found');
    if (existing.author_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');
    return { role, existing };
  }

  // ── Blog Comments ────────────────────────────────────────────

  async getBlogComments(
    postId: string,
    userId?: string,
  ): Promise<BlogComment[]> {
    return this.blogRepository.getBlogComments(postId, userId);
  }

  async createBlogComment(
    postId: string,
    dto: CreateBlogCommentDto,
    userId: string,
  ): Promise<BlogComment> {
    const payload: InsertBlogCommentPayload = {
      post_id: postId,
      user_id: userId,
      body: dto.body,
      parent_id: dto.parentId || null,
    };
    return this.blogRepository.insertBlogComment(payload);
  }

  async updateBlogComment(
    id: string,
    body: string,
    userId: string,
  ): Promise<BlogComment> {
    const existing = await this.blogRepository.getBlogCommentById(id);
    if (!existing) throw new NotFoundException('Comment not found');

    const role = await this.userRolesRepo.getRole(userId);
    if (existing.user_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    return this.blogRepository.updateBlogComment(id, body);
  }

  async deleteBlogComment(
    id: string,
    userId: string,
  ): Promise<SuccessResponse> {
    const existing = await this.blogRepository.getBlogCommentById(id);
    if (!existing) throw new NotFoundException('Comment not found');

    const role = await this.userRolesRepo.getRole(userId);
    if (existing.user_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    await this.blogRepository.deleteBlogComment(id);
    return { success: true };
  }

  async toggleBlogCommentLike(
    id: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const existing = await this.blogRepository.getBlogCommentById(id);
    if (!existing) throw new NotFoundException('Comment not found');

    const liked = await this.blogRepository.toggleBlogCommentLike(id, userId);
    return { liked };
  }

  // Submissions
  async createBlogSubmission(
    data: CreateBlogSubmissionDto,
    userId: string,
  ): Promise<SubmissionCreatedResponse> {
    const withinLimit = await this.blogRepository.checkBlogSubmissionLimit(
      userId,
      5,
    );
    if (withinLimit === false)
      throw new BadRequestException('Daily submission limit reached');

    const sanitizedContent = sanitizeHtml(data.content);

    const submission = await this.blogRepository.insertBlogSubmission({
      user_id: userId,
      title: data.title,
      content: sanitizedContent,
      author_name: data.author_name,
      author_email: data.author_email,
      category: data.category,
      video_url: data.video_url || null,
      media_urls: data.media_urls || [],
      status: 'pending_review',
      payment_details: data.payment_details || null,
    });

    return { submissionId: submission.id };
  }

  async getBlogSubmissions(
    filters: GetBlogSubmissionsQueryDto,
    userId: string,
  ): Promise<BlogSubmission[]> {
    await this.checkAdmin(userId);
    return this.blogRepository.getBlogSubmissions(filters);
  }

  async getUserBlogSubmissions(userId: string): Promise<BlogSubmission[]> {
    return this.blogRepository.getUserBlogSubmissions(userId);
  }

  async approveBlogSubmission(
    submissionId: string,
    userId: string,
  ): Promise<BlogPost> {
    await this.checkAdmin(userId);
    const submission =
      await this.blogRepository.getBlogSubmissionById(submissionId);
    if (!submission || submission.status !== 'pending_review')
      throw new BadRequestException('Invalid submission');

    const updatedSubRows = await this.blogRepository.updateBlogSubmissionStatus(
      submissionId,
      'approved',
      'pending_review',
    );

    if (!updatedSubRows || updatedSubRows.length === 0)
      throw new BadRequestException('Already processed');

    const coverImageUrl = submission.media_urls?.[0] || null;
    let post: BlogPost;
    let uniqueSlug = '';

    try {
      uniqueSlug = await this.resolveSlug(slugify(submission.title));
      post = await this.blogRepository.insertBlogPost({
        title: submission.title,
        slug: uniqueSlug,
        content: submission.content,
        excerpt: generateExcerpt(submission.content),
        category: submission.category || null,
        video_url: submission.video_url,
        cover_image_url: coverImageUrl,
        author_id: submission.user_id,
        status: 'published',
        is_featured: false,
        published_at: new Date().toISOString(),
      });
    } catch (err) {
      await this.blogRepository.updateBlogSubmissionStatus(
        submissionId,
        'pending_review',
        'approved',
      );
      throw err;
    }

    const authorProfile = await this.blogRepository.getProfileForNotification(
      submission.user_id,
    );

    await this.blogRepository.insertNotification({
      user_id: submission.user_id,
      title: 'Blog Post Published!',
      message: `Your submission "${submission.title}" has been approved and published.`,
      type: 'success',
      link: `/blog/${uniqueSlug}`,
    });

    if (authorProfile?.email) {
      void this.blogRepository.invokeEmailFunction({
        to: authorProfile.email,
        type: 'blog_submission_approved',
        data: {
          postTitle: submission.title,
          postUrl: `https://alanyaholidays.com/blog/${uniqueSlug}`,
          authorName: authorProfile.full_name || 'Author',
        },
      });
    }

    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'blog_submission',
        entity_id: submissionId,
        action: 'approve',
        admin_id: userId,
        metadata: { post_id: post.id, title: submission.title },
      });
    }

    return post;
  }

  async rejectBlogSubmission(
    submissionId: string,
    reason: string,
    userId: string,
  ): Promise<SuccessResponse> {
    await this.checkAdmin(userId);
    if (!reason || reason.trim().length < 10)
      throw new BadRequestException('Reason must be at least 10 chars');

    const submission =
      await this.blogRepository.getBlogSubmissionById(submissionId);
    if (!submission || submission.status !== 'pending_review')
      throw new BadRequestException('Invalid submission');

    await this.blogRepository.updateBlogSubmissionStatus(
      submissionId,
      'rejected',
      'pending_review',
      { rejection_reason: reason },
    );

    const authorProfile = await this.blogRepository.getProfileForNotification(
      submission.user_id,
    );

    await this.blogRepository.insertNotification({
      user_id: submission.user_id,
      title: 'Blog Post Rejected',
      message: `Your submission "${submission.title}" was rejected. Reason: ${reason}`,
      type: 'error',
    });

    if (authorProfile?.email) {
      void this.blogRepository.invokeEmailFunction({
        to: authorProfile.email,
        type: 'blog_submission_rejected',
        data: {
          postTitle: submission.title,
          reason,
          authorName: authorProfile.full_name || 'Author',
        },
      });
    }

    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'blog_submission',
        entity_id: submissionId,
        action: 'reject',
        admin_id: userId,
        reason,
        metadata: { title: submission.title },
      });
    }

    return { success: true };
  }
}
