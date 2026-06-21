import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { BlogPost, BlogTag, BlogPostStatus, BlogSubmission } from '../../types/models';
import { blogPostSchema, blogSubmissionSchema } from './schemas';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { toArray } from '../../utils/supabaseHelpers';
import { retry } from '../../utils/retry';
import DOMPurify from 'dompurify';

const SUPABASE_HOST = new URL(import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321').hostname;
const IS_DEV = import.meta.env.DEV === true;

function isAuthorizedStorageUrl(url: string, userId: string): boolean {
    try {
        const parsed = new URL(url);
        const validHost = parsed.hostname === SUPABASE_HOST || (IS_DEV && parsed.hostname === 'localhost');
        const validPath = parsed.pathname.startsWith(`/storage/v1/object/public/blog-media/${userId}/`);
        return validHost && validPath;
    } catch {
        return false;
    }
}

// ============================================================
// Types
// ============================================================

interface BlogPostFilters {
    category?: string;
    status?: string;
    is_featured?: boolean;
    authorId?: string;
    limit?: number;
    offset?: number;
}

/** Raw response from Supabase with nested tag structure */
interface BlogPostRaw {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    video_url: string | null;
    cover_image_url: string | null;
    author_id: string | null;
    category: string | null;
    status: BlogPostStatus;
    is_featured: boolean;
    views: number;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    author?: { full_name: string | null; avatar_url: string | null } | null;
    tags?: Array<{ tag: BlogTag | null } | null>;
}

export interface BlogPostWithTags extends BlogPost {
    tags?: BlogTag[];
}

/** Lightweight version for card/list views — no content field */
export interface BlogPostPreview {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image_url: string | null;
    category: string | null;
    published_at: string | null;
    views?: number;
    author?: { full_name: string | null; avatar_url: string | null } | null;
    tags?: BlogTag[];
}

// ============================================================
// Helper: auto-generate excerpt from content
// ============================================================
function generateExcerpt(content: string | null, maxLength: number = 200): string | null {
    if (!content) return null;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.slice(0, maxLength).trimEnd() + '\u2026';
}

// ============================================================
// Helper: resolve slug conflicts
// ============================================================
function escapePostgREST(value: string): string {
    return value.replace(/%/g, '\\%').replace(/\./g, '\\.').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

async function resolveSlug(baseSlug: string): Promise<string> {
    const { data, error } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('slug', baseSlug)
        .or(`slug.like.${escapePostgREST(baseSlug)}-%`);

    if (error) throw new Error(`Failed to check slug uniqueness: ${error.message}`);

    const rows = toArray<{ slug: string }>(data);
    const existingSlugs = rows.map((row: { slug: string }) => row.slug);
    return generateUniqueSlug(baseSlug, existingSlugs);
}

// ============================================================
// Blog Posts CRUD
// ============================================================

export const blogService = {
    /**
     * Fetch blog posts with optional filters.
     * Admin users can see all statuses; others see only published.
     */
    async getBlogPosts(filters: BlogPostFilters = {}): Promise<{ data: BlogPostWithTags[]; total: number }> {
        const { data: { user } } = await supabase.auth.getUser();
        const role = user ? await getUserRole(user.id) : 'anon';

        const limit = filters.limit ?? 10;
        const offset = filters.offset ?? 0;

        let query = supabase
            .from('blog_posts')
            .select(`
                *,
                author:profiles!blog_posts_author_id_fkey(full_name, avatar_url),
                tags:blog_post_tags(tag:blog_tags(id, name, slug))
            `, { count: 'exact' });

        // Status filter
        if (filters.status) {
            query = query.eq('status', filters.status);
        } else if (role !== 'admin' && !(user && filters.authorId === user.id)) {
            // Non-admin, non-author: only published
            query = query.eq('status', 'published');
        }

        // Category filter
        if (filters.category) {
            query = query.eq('category', filters.category);
        }

        // Featured filter
        if (filters.is_featured) {
            query = query.eq('is_featured', true);
        }

        // Author filter
        if (filters.authorId) {
            query = query.eq('author_id', filters.authorId);
        }

        // Order by published_at descending
        const { data, error, count } = await query
            .order('published_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Flatten the nested tags response
        const flattened = (data || []).map((post: BlogPostRaw) => ({
            ...post,
            tags: (post.tags || [])
                .map((t) => t?.tag)
                .filter(Boolean) as BlogTag[],
        })) as BlogPostWithTags[];

        return { data: flattened, total: count || 0 };
    },

    /**
     * Fetch featured blog posts for the landing page.
     * Uses idx_blog_posts_featured partial index (is_featured=true AND status='published').
     */
    async getFeaturedBlogPosts(limit: number = 3): Promise<BlogPostPreview[]> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select(`
                id,
                title,
                slug,
                excerpt,
                cover_image_url,
                category,
                published_at,
                author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)
            `)
            .eq('is_featured', true)
            .eq('status', 'published')
            .order('published_at', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) throw error;
        return (data || []) as unknown as BlogPostPreview[];
    },

    /**
     * Fetch a single blog post by slug. Optionally increments views.
     */
    async getBlogPost(slug: string, incrementViews: boolean = true): Promise<BlogPostWithTags | null> {
        const { data, error } = await supabase
            .from('blog_posts')
            .select(`
                *,
                author:profiles!blog_posts_author_id_fkey(full_name, avatar_url),
                tags:blog_post_tags(tag:blog_tags(id, name, slug))
            `)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        const post = data as BlogPostRaw;
        const result: BlogPostWithTags = {
            ...post,
            tags: (post.tags || [])
                .map((t) => t?.tag)
                .filter(Boolean) as BlogTag[],
        };

        // Increment views atomically via RPC
        if (incrementViews && result.status === 'published') {
            try {
                await supabase.rpc('increment_blog_views', { p_post_id: result.id });
            } catch {
                // Non-critical — don't fail the fetch
            }
        }

        return result;
    },

    /**
     * Fetch related blog posts.
     * Matches by category, excludes current post.
     * Fills up to limit with other latest published posts if category has too few posts.
     */
    async getRelatedPosts(postId: string, category: string | null, limit: number = 3): Promise<BlogPostPreview[]> {
        let relatedData: BlogPostPreview[] = [];

        if (category) {
            const { data, error } = await supabase
                .from('blog_posts')
                .select(`
                    id,
                    title,
                    slug,
                    excerpt,
                    cover_image_url,
                    category,
                    published_at,
                    author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)
                `)
                .eq('status', 'published')
                .eq('category', category)
                .neq('id', postId)
                .order('published_at', { ascending: false, nullsFirst: false })
                .limit(limit);

            if (error) throw error;
            relatedData = (data || []) as unknown as BlogPostPreview[];
        }

        if (relatedData.length < limit) {
            const excludedIds = [postId, ...relatedData.map((p) => p.id)];
            const fillLimit = limit - relatedData.length;

            const { data: fillData, error: fillError } = await supabase
                .from('blog_posts')
                .select(`
                    id,
                    title,
                    slug,
                    excerpt,
                    cover_image_url,
                    category,
                    published_at,
                    author:profiles!blog_posts_author_id_fkey(full_name, avatar_url)
                `)
                .eq('status', 'published')
                .not('id', 'in', `(${excludedIds.join(',')})`)
                .order('published_at', { ascending: false, nullsFirst: false })
                .limit(fillLimit);

            if (fillError) throw fillError;
            if (fillData) {
                relatedData = [...relatedData, ...(fillData as unknown as BlogPostPreview[])];
            }
        }

        return relatedData;
    },

    /**
     * Create a new blog post. Auto-generates slug from title.
     */
    async createBlogPost(data: {
        title: string;
        slug?: string;
        content?: string;
        excerpt?: string;
        video_url?: string;
        cover_image_url?: string;
        category?: string;
        status?: 'draft' | 'published' | 'archived';
        is_featured?: boolean;
        tag_ids?: string[];
    }): Promise<BlogPost> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Auto-generate slug if not provided
        const baseSlug = data.slug || slugify(data.title);
        const uniqueSlug = await resolveSlug(baseSlug);

        // Auto-generate excerpt if not provided
        const excerpt = data.excerpt || generateExcerpt(data.content || null);

        const validatedData = blogPostSchema.parse({
            ...data,
            slug: uniqueSlug,
            excerpt,
        });

        // Set published_at when publishing
        const publishedAt = validatedData.status === 'published' ? new Date().toISOString() : null;

        const { data: post, error } = await supabase
            .from('blog_posts')
            .insert([{
                title: validatedData.title,
                slug: validatedData.slug,
                content: validatedData.content,
                excerpt: validatedData.excerpt,
                video_url: validatedData.video_url || null,
                cover_image_url: validatedData.cover_image_url || null,
                author_id: user.id,
                category: validatedData.category || null,
                status: validatedData.status,
                is_featured: validatedData.is_featured && (await getUserRole(user.id)) === 'admin' ? true : false,
                published_at: publishedAt,
            }])
            .select()
            .single();

        if (error) throw error;

        // Attach tags if provided
        const tagIds = data.tag_ids || validatedData.tag_ids;
        if (tagIds && tagIds.length > 0) {
            const tagRows = tagIds.map((tagId: string) => ({ post_id: post.id, tag_id: tagId }));
            const { error: tagError } = await supabase
                .from('blog_post_tags')
                .insert(tagRows);
            if (tagError) console.error('Failed to attach tags:', tagError);
        }

        return post as BlogPost;
    },

    /**
     * Update a blog post. Author or admin only.
     */
    async updateBlogPost(id: string, updates: Partial<{
        title: string;
        slug: string;
        content: string;
        excerpt: string;
        video_url: string;
        cover_image_url: string;
        category: string;
        status: 'draft' | 'published' | 'archived';
        is_featured: boolean;
        tag_ids: string[];
    }>): Promise<BlogPost> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);

        // Verify ownership
        const { data: existing } = await supabase
            .from('blog_posts')
            .select('author_id, status, slug')
            .eq('id', id)
            .single();

        if (!existing) throw new Error('Blog post not found');
        if (existing.author_id !== user.id && role !== 'admin') {
            throw new Error('Not authorized');
        }

        // Build safe updates
        const safe: Record<string, unknown> = {};

        if (updates.title !== undefined) {
            safe.title = updates.title;
            // Re-generate slug when title changes (only if not custom-set)
            if (!updates.slug) {
                safe.slug = await resolveSlug(slugify(updates.title));
            }
        }

        if (updates.content !== undefined) safe.content = updates.content;
        if (updates.excerpt !== undefined) safe.excerpt = updates.excerpt;
        else if (updates.content !== undefined) safe.excerpt = generateExcerpt(updates.content);

        if (updates.video_url !== undefined) safe.video_url = updates.video_url || null;
        if (updates.cover_image_url !== undefined) safe.cover_image_url = updates.cover_image_url || null;
        if (updates.category !== undefined) safe.category = updates.category || null;

        if (updates.status !== undefined) {
            safe.status = updates.status;
            // Set published_at when transitioning to published
            if (updates.status === 'published' && existing.status !== 'published') {
                safe.published_at = new Date().toISOString();
            }
        }

        // is_featured is admin-only
        if (updates.is_featured !== undefined && role === 'admin') {
            safe.is_featured = updates.is_featured;
        }

        const { data: post, error } = await supabase
            .from('blog_posts')
            .update({ ...safe, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Sync tags if provided
        if (updates.tag_ids !== undefined) {
            // Remove existing tags
            await supabase.from('blog_post_tags').delete().eq('post_id', id);

            // Insert new tags
            if (updates.tag_ids.length > 0) {
                const tagRows = updates.tag_ids.map((tagId: string) => ({ post_id: id, tag_id: tagId }));
                const { error: tagError } = await supabase
                    .from('blog_post_tags')
                    .insert(tagRows);
                if (tagError) console.error('Failed to sync tags:', tagError);
            }
        }

        return post as BlogPost;
    },

    /**
     * Delete a blog post. Admin only.
     */
    async deleteBlogPost(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can delete blog posts');

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ============================================================
    // Tags
    // ============================================================

    async getBlogTags(): Promise<BlogTag[]> {
        const { data, error } = await supabase
            .from('blog_tags')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data as BlogTag[];
    },

    async createBlogTag(name: string): Promise<BlogTag> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can create tags');

        const tagSlug = slugify(name);

        const { data, error } = await supabase
            .from('blog_tags')
            .insert([{ name, slug: tagSlug }])
            .select()
            .single();

        if (error) throw error;
        return data as BlogTag;
    },

    async deleteBlogTag(id: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can delete tags');

        const { error } = await supabase
            .from('blog_tags')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ============================================================
    // Tag assignments
    // ============================================================

    async addTagToPost(postId: string, tagId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('blog_post_tags')
            .insert([{ post_id: postId, tag_id: tagId }]);

        if (error) throw error;
    },

    async removeTagFromPost(postId: string, tagId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('blog_post_tags')
            .delete()
            .eq('post_id', postId)
            .eq('tag_id', tagId);

        if (error) throw error;
    },

    // ============================================================
    // Blog Submissions (User-submitted posts requiring payment + moderation)
    // ============================================================

    /**
     * Create a blog submission.
     * Creates submission with status='pending_review'.
     */
    async createBlogSubmission(data: {
        title: string;
        content: string;
        video_url?: string;
        media_urls?: string[];
        payment_details?: string;
    }): Promise<{ submissionId: string }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // A2-L1: Rate limiting (3-5 per day)
        const { data: withinLimit, error: limitError } = await supabase.rpc('check_blog_submission_limit', {
            p_user_id: user.id,
            p_limit: 5 // Default limit
        });

        if (limitError) console.error('Rate limit check failed:', limitError);
        if (withinLimit === false) {
            throw new Error('Daily submission limit reached (max 5 per 24h). Please try again tomorrow.');
        }

        const validatedData = blogSubmissionSchema.parse(data);

        // A2-L2: Sanitize content before storage (Defense-in-depth)
        const sanitizedContent = typeof window !== 'undefined'
            ? DOMPurify.sanitize(validatedData.content)
            : validatedData.content;

        // Create submission record
        const { data: submission, error: subError } = await supabase
            .from('blog_submissions')
            .insert([{
                user_id: user.id,
                title: validatedData.title,
                content: sanitizedContent,
                video_url: validatedData.video_url || null,
                media_urls: (validatedData.media_urls || []).filter(url =>
                    isAuthorizedStorageUrl(url, user.id)
                ),
                status: 'pending_review',
                payment_details: data.payment_details || null,
            }])
            .select()
            .single();

        if (subError || !submission) throw subError || new Error('Failed to create submission');

        return { submissionId: submission.id };
    },

    /**
     * Get all blog submissions. Admin only.
     */
    async getBlogSubmissions(filters?: { status?: string; userId?: string }): Promise<BlogSubmission[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can view all submissions');

        let query = supabase
            .from('blog_submissions')
            .select(`
                *,
                user:profiles!blog_submissions_user_id_fkey(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.userId) query = query.eq('user_id', filters.userId);

        const { data, error } = await query;
        if (error) throw error;
        return data as BlogSubmission[];
    },

    /**
     * Get current user's own blog submissions.
     */
    async getUserBlogSubmissions(): Promise<BlogSubmission[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('blog_submissions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as BlogSubmission[];
    },

    /**
     * Approve a blog submission: creates a blog_post from the submission data.
     * Admin only. Sends email to author.
     */
    async approveBlogSubmission(submissionId: string): Promise<BlogPost> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can approve submissions');

        // Get submission
        const { data: submission, error: subError } = await supabase
            .from('blog_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (subError || !submission) throw subError || new Error('Submission not found');
        if (submission.status !== 'pending_review') throw new Error('Submission is not pending review');

        // A2-C2: Update submission status first (optimistic lock)
        const { data: updatedSubRows, error: updateError } = await supabase
            .from('blog_submissions')
            .update({
                status: 'approved',
            })
            .eq('id', submissionId)
            .eq('status', 'pending_review')
            .select('id');

        if (updateError) throw updateError;
        if (!updatedSubRows || updatedSubRows.length === 0) {
            throw new Error('Submission is already being processed or not in pending state');
        }

        const coverImageUrl = submission.media_urls?.[0] || null;

        let post;
        let uniqueSlug = '';
        try {
            // H5: Strict domain + path validation for cover image [A2-H5]
            // Inside try-catch so rollback fires if validation fails after status was set to 'approved'
            if (coverImageUrl) {
                if (!isAuthorizedStorageUrl(coverImageUrl, submission.user_id)) {
                    throw new Error('Invalid cover image domain');
                }

                // H5: Verify file exists in storage to prevent dead links [A2-H5]
                // Path format: .../blog-media/{userId}/{fileName}
                const pathParts = coverImageUrl.split(`${submission.user_id}/`);
                const fileName = pathParts[pathParts.length - 1];

                if (!fileName) {
                    throw new Error('Invalid cover image path');
                }

                const { data: files, error: listError } = await supabase.storage
                    .from('blog-media')
                    .list(submission.user_id, {
                        search: fileName,
                        limit: 1
                    });

                if (listError || !files || files.length === 0 || files[0].name !== fileName) {
                    throw new Error('Cover image not found in storage. It may have been deleted.');
                }
            }

            // Create blog post from submission
            const baseSlug = slugify(submission.title);
            uniqueSlug = await resolveSlug(baseSlug);

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

            if (postError || !newPost) throw postError || new Error('Failed to create blog post');
            post = newPost;
        } catch (err) {
            // Compensation: rollback status if post creation fails
            const { error: rollbackError } = await supabase
                .from('blog_submissions')
                .update({ status: 'pending_review' })
                .eq('id', submissionId);
            if (rollbackError) {
                console.error(`Compensation rollback failed for submission ${submissionId}:`, rollbackError.message, '— submission stuck in approved without a post');
            }
            throw err;
        }

        // Notify author
        const { data: authorProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', submission.user_id)
            .single();

        try {
            await supabase.from('notifications').insert({
                user_id: submission.user_id,
                title: 'Blog Post Published!',
                message: `Your submission "${submission.title}" has been approved and published.`,
                type: 'success',
                link: `/blog/${uniqueSlug}`,
            });
        } catch (err) {
            console.error('Failed to create approval notification:', err);
        }

        // Send approval email
        if (authorProfile?.email) {
            try {
                // A2-M4: Retry email invocation
                await retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        to: authorProfile.email,
                        type: 'blog_submission_approved',
                        data: {
                            postTitle: submission.title,
                            postUrl: `${window.location.origin}/blog/${uniqueSlug}`,
                            authorName: authorProfile.full_name || 'Author',
                        },
                    },
                }), { attempts: 3, delay: 1000 });
            } catch (e) {
                console.error('Failed to send approval email after retries:', e);
            }
        }

        return post as BlogPost;
    },

    /**
     * Reject a blog submission. Admin only. Sends email to author with reason.
     * Deletes associated media files from storage.
     */
    async rejectBlogSubmission(submissionId: string, reason: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const role = await getUserRole(user.id);
        if (role !== 'admin') throw new Error('Only admins can reject submissions');
        if (!reason || reason.trim().length < 10) throw new Error('Rejection reason must be at least 10 characters');
        if (reason.length > 500) throw new Error('Rejection reason cannot exceed 500 characters');

        // Get submission
        const { data: submission, error: subError } = await supabase
            .from('blog_submissions')
            .select('*')
            .eq('id', submissionId)
            .single();

        if (subError || !submission) throw subError || new Error('Submission not found');
        if (submission.status !== 'pending_review') {
            throw new Error(`Cannot reject submission with status '${submission.status}'`);
        }

        // Update submission status first — only delete files if this succeeds
        const { error: rejectError } = await supabase
            .from('blog_submissions')
            .update({
                status: 'rejected',
                rejection_reason: reason,
            })
            .eq('id', submissionId);

        if (rejectError) throw rejectError;

        // Delete media files from storage only after status is committed
        if (submission.media_urls && submission.media_urls.length > 0) {
            try {
                // Extract file paths from public URLs
                const filePaths = submission.media_urls
                    .map((url: string) => {
                        try {
                            const parsed = new URL(url);
                            // Path format: /storage/v1/object/public/blog-media/{userId}/{filename}
                            const prefix = '/storage/v1/object/public/blog-media/';
                            if (parsed.pathname.startsWith(prefix)) {
                                const relativePath = parsed.pathname.slice(prefix.length);
                                return relativePath.startsWith(`${submission.user_id}/`) ? relativePath : null;
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean) as string[];

                if (filePaths.length > 0) {
                    await supabase.storage
                        .from('blog-media')
                        .remove(filePaths);
                }
            } catch (e) {
                console.error('Failed to delete submission media files:', e);
                // Non-critical — continue with rejection
            }
        }

        // Notify author
        try {
            await supabase.from('notifications').insert({
                user_id: submission.user_id,
                title: 'Blog Submission Rejected',
                message: `Your submission "${submission.title}" was not approved. Reason: ${reason}`,
                type: 'warning',
                link: '/blog/submit',
            });
        } catch (err) {
            console.error('Failed to create rejection notification:', err);
        }

        // Send rejection email
        const { data: authorProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', submission.user_id)
            .single();

        if (authorProfile?.email) {
            try {
                // A2-M4: Retry email invocation
                await retry(() => supabase.functions.invoke('send-email', {
                    body: {
                        to: authorProfile.email,
                        type: 'blog_submission_rejected',
                        data: {
                            postTitle: submission.title,
                            reason,
                            authorName: authorProfile.full_name || 'Author',
                        },
                    },
                }), { attempts: 3, delay: 1000 });
            } catch (e) {
                console.error('Failed to send rejection email after retries:', e);
            }
        }
    },
};
