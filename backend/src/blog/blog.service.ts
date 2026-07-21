import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BlogRepository } from './blog.repository';
import sanitizeHtml from 'sanitize-html';

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

const generateExcerpt = (content: string | null, maxLength = 200) => {
  if (!content) return null;
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trimEnd() + '\u2026';
};

@Injectable()
export class BlogService {
  constructor(private readonly blogRepository: BlogRepository) {}

  private async checkAdmin(userId: string) {
    const role = await this.blogRepository.getUserRole(userId);
    if (role !== 'admin') throw new UnauthorizedException('Admin only');
  }

  private async resolveSlug(baseSlug: string) {
    const existingSlugs = await this.blogRepository.getSlugs(baseSlug);
    if (!existingSlugs.includes(baseSlug)) return baseSlug;
    let counter = 1;
    let newSlug = `${baseSlug}-${counter}`;
    while (existingSlugs.includes(newSlug)) {
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }
    return newSlug;
  }

  async getBlogPosts(filters: any, requestUserId?: string) {
    let role = 'anon';
    if (requestUserId) {
      const userRole = await this.blogRepository.getUserRole(requestUserId);
      if (userRole) role = userRole;
    }

    const limit = filters.limit ? parseInt(filters.limit) : 10;
    const offset = filters.offset ? parseInt(filters.offset) : 0;

    const { data, count } = await this.blogRepository.getBlogPosts(
      filters,
      limit,
      offset,
      role,
      requestUserId,
    );

    const flattened = (data || []).map((post: any) => ({
      ...post,
      tags: (post.tags || []).map((t: any) => t?.tag).filter(Boolean),
    }));

    return { data: flattened, total: count || 0 };
  }

  async getFeaturedBlogPosts(limit = 3) {
    return this.blogRepository.getFeaturedBlogPosts(limit);
  }

  async getBlogPost(slug: string, incrementViews = true) {
    const data = await this.blogRepository.getBlogPostBySlug(slug);
    if (!data) throw new NotFoundException('Blog post not found');

    const result = {
      ...data,
      tags: (data.tags || []).map((t: any) => t?.tag).filter(Boolean),
    };

    if (incrementViews && result.status === 'published') {
      await this.blogRepository.incrementBlogViews(result.id);
    }
    return result;
  }

  async getRelatedPosts(postId: string, category: string, limit = 3) {
    return this.blogRepository.getRelatedPosts(postId, category, limit);
  }

  async createBlogPost(data: any, userId: string) {
    const role = await this.blogRepository.getUserRole(userId);

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
      cover_image_url: data.cover_image_url || null,
      author_id: userId,
      category: data.category || null,
      status: data.status,
      is_featured: data.is_featured && role === 'admin' ? true : false,
      published_at: publishedAt,
    });

    if (data.tag_ids && data.tag_ids.length > 0) {
      const tagRows = data.tag_ids.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));
      await this.blogRepository.insertBlogPostTags(tagRows);
    }
    return post;
  }

  async updateBlogPost(id: string, updates: any, userId: string) {
    const role = await this.blogRepository.getUserRole(userId);
    const existing = await this.blogRepository.getBlogPostById(id);

    if (!existing) throw new NotFoundException('Blog post not found');
    if (existing.author_id !== userId && role !== 'admin')
      throw new UnauthorizedException('Not authorized');

    const safe: any = {};
    if (updates.title !== undefined) {
      safe.title = updates.title;
      if (!updates.slug)
        safe.slug = await this.resolveSlug(slugify(updates.title));
    }
    if (updates.content !== undefined) safe.content = updates.content;
    if (updates.excerpt !== undefined) safe.excerpt = updates.excerpt;
    else if (updates.content !== undefined)
      safe.excerpt = generateExcerpt(updates.content);
    if (updates.video_url !== undefined)
      safe.video_url = updates.video_url || null;
    if (updates.cover_image_url !== undefined)
      safe.cover_image_url = updates.cover_image_url || null;
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

    if (updates.tag_ids !== undefined) {
      await this.blogRepository.deleteBlogPostTags(id);
      if (updates.tag_ids.length > 0) {
        const tagRows = updates.tag_ids.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));
        await this.blogRepository.insertBlogPostTags(tagRows);
      }
    }
    return post;
  }

  async deleteBlogPost(id: string, userId: string) {
    await this.checkAdmin(userId);
    await this.blogRepository.deleteBlogPost(id);
    return { success: true };
  }

  // Tags
  async getBlogTags() {
    return this.blogRepository.getBlogTags();
  }

  async createBlogTag(name: string, userId: string) {
    await this.checkAdmin(userId);
    return this.blogRepository.insertBlogTag({ name, slug: slugify(name) });
  }

  async deleteBlogTag(id: string, userId: string) {
    await this.checkAdmin(userId);
    await this.blogRepository.deleteBlogTag(id);
    return { success: true };
  }

  async addTagToPost(postId: string, tagId: string, _userId: string) {
    await this.blogRepository.insertSingleBlogPostTag(postId, tagId);
    return { success: true };
  }

  async removeTagFromPost(postId: string, tagId: string, _userId: string) {
    await this.blogRepository.deleteSingleBlogPostTag(postId, tagId);
    return { success: true };
  }

  // Submissions
  async createBlogSubmission(data: any, userId: string) {
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
      video_url: data.video_url || null,
      media_urls: data.media_urls || [],
      status: 'pending_review',
      payment_details: data.payment_details || null,
    });

    return { submissionId: submission.id };
  }

  async getBlogSubmissions(filters: any, userId: string) {
    await this.checkAdmin(userId);
    return this.blogRepository.getBlogSubmissions(filters);
  }

  async getUserBlogSubmissions(userId: string) {
    return this.blogRepository.getUserBlogSubmissions(userId);
  }

  async approveBlogSubmission(submissionId: string, userId: string) {
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
    let post;
    let uniqueSlug = '';

    try {
      uniqueSlug = await this.resolveSlug(slugify(submission.title));
      post = await this.blogRepository.insertBlogPost({
        title: submission.title,
        slug: uniqueSlug,
        content: submission.content,
        excerpt: generateExcerpt(submission.content),
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
      this.blogRepository.invokeEmailFunction({
        to: authorProfile.email,
        type: 'blog_submission_approved',
        data: {
          postTitle: submission.title,
          postUrl: `https://alanyaholidays.com/blog/${uniqueSlug}`,
          authorName: authorProfile.full_name || 'Author',
        },
      });
    }

    return post;
  }

  async rejectBlogSubmission(
    submissionId: string,
    reason: string,
    userId: string,
  ) {
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
      this.blogRepository.invokeEmailFunction({
        to: authorProfile.email,
        type: 'blog_submission_rejected',
        data: {
          postTitle: submission.title,
          reason,
          authorName: authorProfile.full_name || 'Author',
        },
      });
    }

    return { success: true };
  }
}
