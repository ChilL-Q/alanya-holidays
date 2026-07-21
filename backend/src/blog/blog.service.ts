import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import sanitizeHtml from 'sanitize-html';

const slugify = (text: string) => text.toString().toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');

const generateExcerpt = (content: string | null, maxLength = 200) => {
  if (!content) return null;
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trimEnd() + '\u2026';
};

const escapePostgREST = (value: string) => value.replace(/%/g, '\\%').replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

@Injectable()
export class BlogService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private async checkAdmin(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data?.role !== 'admin') throw new UnauthorizedException('Admin only');
    return supabase;
  }

  private async resolveSlug(baseSlug: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('slug', baseSlug)
      .or(`slug.like.${escapePostgREST(baseSlug)}-%`);
    if (error) throw new Error(error.message);
    const existingSlugs = data.map(r => r.slug);
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
    const supabase = this.supabaseService.getClient();
    let role = 'anon';
    if (requestUserId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', requestUserId).single();
      if (profile) role = profile.role;
    }

    const limit = filters.limit ? parseInt(filters.limit) : 10;
    const offset = filters.offset ? parseInt(filters.offset) : 0;

    let query = supabase
      .from('blog_posts')
      .select(`*, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url), tags:blog_post_tags(tag:blog_tags(id, name, slug))`, { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else if (role !== 'admin' && !(requestUserId && filters.authorId === requestUserId)) {
      query = query.eq('status', 'published');
    }

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.is_featured === 'true') query = query.eq('is_featured', true);
    if (filters.authorId) query = query.eq('author_id', filters.authorId);
    if (filters.search) {
      const safe = filters.search.trim().replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/,/g, ' ');
      if (safe) query = query.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
    }

    const { data, error, count } = await query
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const flattened = (data || []).map((post: any) => ({
      ...post,
      tags: (post.tags || []).map((t: any) => t?.tag).filter(Boolean),
    }));

    return { data: flattened, total: count || 0 };
  }

  async getFeaturedBlogPosts(limit = 3) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`id, title, slug, excerpt, cover_image_url, category, published_at, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)`)
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  }

  async getBlogPost(slug: string, incrementViews = true) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`*, author:profiles!blog_posts_author_id_fkey(full_name, avatar_url), tags:blog_post_tags(tag:blog_tags(id, name, slug))`)
      .eq('slug', slug)
      .single();

    if (error) throw new NotFoundException('Blog post not found');

    const result = {
      ...data,
      tags: (data.tags || []).map((t: any) => t?.tag).filter(Boolean),
    };

    if (incrementViews && result.status === 'published') {
      try {
        await supabase.rpc('increment_blog_views', { p_post_id: result.id });
      } catch (e) {}
    }
    return result;
  }

  async getRelatedPosts(postId: string, category: string, limit = 3) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.rpc('get_related_posts', {
      p_post_id: postId,
      p_category: category,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async createBlogPost(data: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const roleRes = await supabase.from('profiles').select('role').eq('id', userId).single();
    const role = roleRes.data?.role;

    const baseSlug = data.slug || slugify(data.title);
    const uniqueSlug = await this.resolveSlug(baseSlug);
    const excerpt = data.excerpt || generateExcerpt(data.content || null);
    const publishedAt = data.status === 'published' ? new Date().toISOString() : null;

    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert([{
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
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (data.tag_ids && data.tag_ids.length > 0) {
      const tagRows = data.tag_ids.map((tagId: string) => ({ post_id: post.id, tag_id: tagId }));
      await supabase.from('blog_post_tags').insert(tagRows);
    }
    return post;
  }

  async updateBlogPost(id: string, updates: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    const role = profile?.role;

    const { data: existing } = await supabase.from('blog_posts').select('author_id, status, slug').eq('id', id).single();
    if (!existing) throw new NotFoundException('Blog post not found');
    if (existing.author_id !== userId && role !== 'admin') throw new UnauthorizedException('Not authorized');

    const safe: any = {};
    if (updates.title !== undefined) {
      safe.title = updates.title;
      if (!updates.slug) safe.slug = await this.resolveSlug(slugify(updates.title));
    }
    if (updates.content !== undefined) safe.content = updates.content;
    if (updates.excerpt !== undefined) safe.excerpt = updates.excerpt;
    else if (updates.content !== undefined) safe.excerpt = generateExcerpt(updates.content);
    if (updates.video_url !== undefined) safe.video_url = updates.video_url || null;
    if (updates.cover_image_url !== undefined) safe.cover_image_url = updates.cover_image_url || null;
    if (updates.category !== undefined) safe.category = updates.category || null;
    if (updates.status !== undefined) {
      safe.status = updates.status;
      if (updates.status === 'published' && existing.status !== 'published') {
        safe.published_at = new Date().toISOString();
      }
    }
    if (updates.is_featured !== undefined && role === 'admin') {
      safe.is_featured = updates.is_featured;
    }

    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({ ...safe, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (updates.tag_ids !== undefined) {
      await supabase.from('blog_post_tags').delete().eq('post_id', id);
      if (updates.tag_ids.length > 0) {
        const tagRows = updates.tag_ids.map((tagId: string) => ({ post_id: id, tag_id: tagId }));
        await supabase.from('blog_post_tags').insert(tagRows);
      }
    }
    return post;
  }

  async deleteBlogPost(id: string, userId: string) {
    const supabase = await this.checkAdmin(userId);
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Tags
  async getBlogTags() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('blog_tags').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  async createBlogTag(name: string, userId: string) {
    const supabase = await this.checkAdmin(userId);
    const { data, error } = await supabase.from('blog_tags').insert([{ name, slug: slugify(name) }]).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteBlogTag(id: string, userId: string) {
    const supabase = await this.checkAdmin(userId);
    const { error } = await supabase.from('blog_tags').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async addTagToPost(postId: string, tagId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('blog_post_tags').insert([{ post_id: postId, tag_id: tagId }]);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async removeTagFromPost(postId: string, tagId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('blog_post_tags').delete().eq('post_id', postId).eq('tag_id', tagId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Submissions
  async createBlogSubmission(data: any, userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data: withinLimit, error: limitError } = await supabase.rpc('check_blog_submission_limit', { p_user_id: userId, p_limit: 5 });
    if (withinLimit === false) throw new BadRequestException('Daily submission limit reached');

    const sanitizedContent = sanitizeHtml(data.content);
    
    const { data: submission, error } = await supabase
      .from('blog_submissions')
      .insert([{
        user_id: userId,
        title: data.title,
        content: sanitizedContent,
        video_url: data.video_url || null,
        media_urls: data.media_urls || [],
        status: 'pending_review',
        payment_details: data.payment_details || null,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { submissionId: submission.id };
  }

  async getBlogSubmissions(filters: any, userId: string) {
    const supabase = await this.checkAdmin(userId);
    let query = supabase.from('blog_submissions').select(`*, user:profiles!blog_submissions_user_id_fkey(full_name, email)`).order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.userId) query = query.eq('user_id', filters.userId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserBlogSubmissions(userId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.from('blog_submissions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async approveBlogSubmission(submissionId: string, userId: string) {
    const supabase = await this.checkAdmin(userId);
    const { data: submission } = await supabase.from('blog_submissions').select('*').eq('id', submissionId).single();
    if (!submission || submission.status !== 'pending_review') throw new BadRequestException('Invalid submission');

    const { data: updatedSubRows, error: updateError } = await supabase
      .from('blog_submissions')
      .update({ status: 'approved' })
      .eq('id', submissionId)
      .eq('status', 'pending_review')
      .select('id');

    if (!updatedSubRows || updatedSubRows.length === 0) throw new BadRequestException('Already processed');

    const coverImageUrl = submission.media_urls?.[0] || null;
    let post;
    let uniqueSlug = '';

    try {
      uniqueSlug = await this.resolveSlug(slugify(submission.title));
      const { data: newPost, error: postError } = await supabase
        .from('blog_posts')
        .insert([{
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
        }])
        .select()
        .single();
      if (postError) throw postError;
      post = newPost;
    } catch (err) {
      await supabase.from('blog_submissions').update({ status: 'pending_review' }).eq('id', submissionId);
      throw err;
    }

    const { data: authorProfile } = await supabase.from('profiles').select('email, full_name').eq('id', submission.user_id).single();
    try {
      await supabase.from('notifications').insert({
        user_id: submission.user_id,
        title: 'Blog Post Published!',
        message: `Your submission "${submission.title}" has been approved and published.`,
        type: 'success',
        link: `/blog/${uniqueSlug}`,
      });
    } catch (err) {}

    if (authorProfile?.email) {
      supabase.functions.invoke('send-email', {
        body: {
          to: authorProfile.email,
          type: 'blog_submission_approved',
          data: {
            postTitle: submission.title,
            postUrl: `https://alanyaholidays.com/blog/${uniqueSlug}`,
            authorName: authorProfile.full_name || 'Author',
          },
        },
      }).catch(err => console.error(err));
    }

    return post;
  }

  async rejectBlogSubmission(submissionId: string, reason: string, userId: string) {
    const supabase = await this.checkAdmin(userId);
    if (!reason || reason.trim().length < 10) throw new BadRequestException('Reason must be at least 10 chars');

    const { data: submission } = await supabase.from('blog_submissions').select('*').eq('id', submissionId).single();
    if (!submission || submission.status !== 'pending_review') throw new BadRequestException('Invalid submission');

    const { error: rejectError } = await supabase.from('blog_submissions').update({ status: 'rejected', rejection_reason: reason }).eq('id', submissionId);
    if (rejectError) throw new Error(rejectError.message);

    const { data: authorProfile } = await supabase.from('profiles').select('email, full_name').eq('id', submission.user_id).single();
    try {
      await supabase.from('notifications').insert({
        user_id: submission.user_id,
        title: 'Blog Post Rejected',
        message: `Your submission "${submission.title}" was rejected. Reason: ${reason}`,
        type: 'error',
      });
    } catch (err) {}

    if (authorProfile?.email) {
      supabase.functions.invoke('send-email', {
        body: {
          to: authorProfile.email,
          type: 'blog_submission_rejected',
          data: {
            postTitle: submission.title,
            reason,
            authorName: authorProfile.full_name || 'Author',
          },
        },
      }).catch(err => console.error(err));
    }

    return { success: true };
  }
}
