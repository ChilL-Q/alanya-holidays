import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import { BlogPost, BlogTag, BlogPostStatus } from '../../types/models';
import { blogPostSchema } from './schemas';
import { slugify, generateUniqueSlug } from '../../utils/slugify';

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

interface BlogPostWithTags extends BlogPost {
    tags?: BlogTag[];
}

// ============================================================
// Helper: auto-generate excerpt from content
// ============================================================
function generateExcerpt(content: string | null, maxLength: number = 200): string | null {
    if (!content) return null;
    const stripped = content.replace(/<[^>]*>/g, '').trim();
    if (stripped.length <= maxLength) return stripped;
    return stripped.slice(0, maxLength).trimEnd() + '…';
}

// ============================================================
// Helper: resolve slug conflicts
// ============================================================
async function resolveSlug(baseSlug: string): Promise<string> {
    const { data } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('slug', baseSlug)
        .or(`slug.like.${baseSlug}-%`);

    const existingSlugs = (data || []).map((row: { slug: string }) => row.slug);
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
};
