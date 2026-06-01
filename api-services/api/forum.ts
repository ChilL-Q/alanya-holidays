import { supabase } from '../supabase';
import { getUserRole } from '../auth';
import {
    ForumCategory,
    ForumPost,
    ForumComment,
    ForumReport,
    ForumReportTargetType,
} from '../../types/models';
import { forumPostSchema, forumCommentSchema, forumCategorySchema, forumReportSchema } from './schemas';
import { slugify, generateUniqueSlug } from '../../utils/slugify';
import { toArray } from '../../utils/supabaseHelpers';
import DOMPurify from 'dompurify';

// ============================================================
// Types
// ============================================================

export type ForumSort = 'new' | 'top';

export interface ForumPostFilters {
    categorySlug?: string;
    sort?: ForumSort;
    limit?: number;
    offset?: number;
    includeRemoved?: boolean;
    removedOnly?: boolean;
}

const POST_SELECT = `
    *,
    category:forum_categories(id, name, slug, description, sort_order, created_at),
    author:profiles!forum_posts_author_id_fkey(full_name, avatar_url)
`;

// ============================================================
// Helpers
// ============================================================

function sanitize(input: string): string {
    return typeof window !== 'undefined' ? DOMPurify.sanitize(input) : input;
}

async function resolveSlug(baseSlug: string): Promise<string> {
    const seed = baseSlug || 'post';
    const [exact, suffixed] = await Promise.all([
        supabase.from('forum_posts').select('slug').eq('slug', seed),
        supabase.from('forum_posts').select('slug').like('slug', `${seed}-%`),
    ]);

    if (exact.error) throw new Error(`Failed to check slug uniqueness: ${exact.error.message}`);
    if (suffixed.error) throw new Error(`Failed to check slug uniqueness: ${suffixed.error.message}`);

    const existingSlugs = [
        ...toArray<{ slug: string }>(exact.data),
        ...toArray<{ slug: string }>(suffixed.data),
    ].map((row: { slug: string }) => row.slug);
    return generateUniqueSlug(seed, existingSlugs);
}

/** Annotate posts/comments with whether the current user has liked them. */
async function annotateLikes<T extends { id: string }>(
    rows: T[],
    table: 'forum_post_likes' | 'forum_comment_likes',
    fkColumn: 'post_id' | 'comment_id',
    userId: string | null,
): Promise<(T & { liked_by_me: boolean })[]> {
    if (!userId || rows.length === 0) {
        return rows.map((r) => ({ ...r, liked_by_me: false }));
    }
    const ids = rows.map((r) => r.id);
    const { data } = await supabase
        .from(table)
        .select(fkColumn)
        .eq('user_id', userId)
        .in(fkColumn, ids);

    const liked = new Set((data || []).map((row: Record<string, string>) => row[fkColumn]));
    return rows.map((r) => ({ ...r, liked_by_me: liked.has(r.id) }));
}

async function requireUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user;
}

async function requireAdmin() {
    const user = await requireUser();
    const role = await getUserRole(user.id);
    if (role !== 'admin') throw new Error('Not authorized');
    return user;
}

// ============================================================
// Forum service
// ============================================================

export const forumService = {
    // ---------- Categories ----------

    async getForumCategories(): Promise<ForumCategory[]> {
        const { data, error } = await supabase
            .from('forum_categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data as ForumCategory[];
    },

    async createForumCategory(input: { name: string; description?: string; sort_order?: number }): Promise<ForumCategory> {
        await requireAdmin();
        const validated = forumCategorySchema.parse(input);
        const baseSlug = slugify(validated.name);

        const { data, error } = await supabase
            .from('forum_categories')
            .insert([{
                name: validated.name,
                slug: baseSlug,
                description: validated.description || null,
                sort_order: validated.sort_order ?? 0,
            }])
            .select()
            .single();

        if (error) throw error;
        return data as ForumCategory;
    },

    async updateForumCategory(id: string, updates: { name?: string; description?: string; sort_order?: number }): Promise<ForumCategory> {
        await requireAdmin();
        const safe: Record<string, unknown> = {};
        if (updates.name !== undefined) {
            safe.name = updates.name;
            safe.slug = slugify(updates.name);
        }
        if (updates.description !== undefined) safe.description = updates.description || null;
        if (updates.sort_order !== undefined) safe.sort_order = updates.sort_order;

        const { data, error } = await supabase
            .from('forum_categories')
            .update(safe)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ForumCategory;
    },

    async deleteForumCategory(id: string): Promise<void> {
        await requireAdmin();
        const { error } = await supabase
            .from('forum_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // ---------- Posts ----------

    async getForumPosts(filters: ForumPostFilters = {}): Promise<{ data: ForumPost[]; total: number }> {
        if (filters.removedOnly && filters.includeRemoved) {
            throw new Error('Cannot specify both removedOnly and includeRemoved');
        }

        const { data: { user } } = await supabase.auth.getUser();
        const limit = filters.limit ?? 20;
        const offset = filters.offset ?? 0;

        let query = supabase
            .from('forum_posts')
            .select(POST_SELECT, { count: 'exact' });

        if (filters.removedOnly) {
            query = query.eq('is_removed', true);
        } else if (!filters.includeRemoved) {
            query = query.eq('is_removed', false);
        }

        if (filters.categorySlug) {
            // Resolve slug → id
            const { data: cat } = await supabase
                .from('forum_categories')
                .select('id')
                .eq('slug', filters.categorySlug)
                .single();
            if (cat) query = query.eq('category_id', cat.id);
        }

        if (filters.sort === 'top') {
            query = query
                .order('is_pinned', { ascending: false })
                .order('like_count', { ascending: false })
                .order('created_at', { ascending: false });
        } else {
            query = query
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
        }

        const { data, error, count } = await query.range(offset, offset + limit - 1);
        if (error) throw error;

        const annotated = await annotateLikes(
            (data || []) as unknown as ForumPost[],
            'forum_post_likes',
            'post_id',
            user?.id ?? null,
        );

        return { data: annotated, total: count || 0 };
    },

    async getForumPost(slug: string): Promise<ForumPost | null> {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('forum_posts')
            .select(POST_SELECT)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        const [annotated] = await annotateLikes(
            [data as unknown as ForumPost],
            'forum_post_likes',
            'post_id',
            user?.id ?? null,
        );
        return annotated;
    },

    async createForumPost(input: { title: string; body: string; category_id?: string }): Promise<ForumPost> {
        const user = await requireUser();
        const validated = forumPostSchema.parse(input);

        const uniqueSlug = await resolveSlug(slugify(validated.title));

        const { data, error } = await supabase
            .from('forum_posts')
            .insert([{
                title: validated.title,
                slug: uniqueSlug,
                body: sanitize(validated.body),
                category_id: validated.category_id || null,
                author_id: user.id,
            }])
            .select()
            .single();

        if (error) throw error;
        return data as ForumPost;
    },

    async updateForumPost(id: string, updates: { title?: string; body?: string; category_id?: string | null }): Promise<ForumPost> {
        const user = await requireUser();
        const role = await getUserRole(user.id);

        const { data: existing } = await supabase
            .from('forum_posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) throw new Error('Post not found');
        if (existing.author_id !== user.id && role !== 'admin') throw new Error('Not authorized');

        const safe: Record<string, unknown> = {};
        if (updates.title !== undefined) safe.title = updates.title;
        if (updates.body !== undefined) safe.body = sanitize(updates.body);
        if (updates.category_id !== undefined) safe.category_id = updates.category_id || null;

        const { data, error } = await supabase
            .from('forum_posts')
            .update(safe)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ForumPost;
    },

    async deleteForumPost(id: string): Promise<void> {
        const user = await requireUser();
        const role = await getUserRole(user.id);

        const { data: existing } = await supabase
            .from('forum_posts')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) throw new Error('Post not found');
        if (existing.author_id !== user.id && role !== 'admin') throw new Error('Not authorized');

        const { error } = await supabase.from('forum_posts').delete().eq('id', id);
        if (error) throw error;
    },

    // ---------- Comments ----------

    async getForumComments(postId: string, options?: { includeRemoved?: boolean }): Promise<ForumComment[]> {
        const { data: { user } } = await supabase.auth.getUser();

        let query = supabase
            .from('forum_comments')
            .select(`
                *,
                author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)
            `)
            .eq('post_id', postId);

        if (!options?.includeRemoved) {
            query = query.eq('is_removed', false);
        }

        query = query.order('created_at', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        return annotateLikes(
            (data || []) as unknown as ForumComment[],
            'forum_comment_likes',
            'comment_id',
            user?.id ?? null,
        );
    },

    async createForumComment(postId: string, body: string): Promise<ForumComment> {
        const user = await requireUser();
        const validated = forumCommentSchema.parse({ body });

        const { data, error } = await supabase
            .from('forum_comments')
            .insert([{
                post_id: postId,
                author_id: user.id,
                body: sanitize(validated.body),
            }])
            .select()
            .single();

        if (error) throw error;
        return data as ForumComment;
    },

    async deleteForumComment(id: string): Promise<void> {
        const user = await requireUser();
        const role = await getUserRole(user.id);

        const { data: existing } = await supabase
            .from('forum_comments')
            .select('author_id')
            .eq('id', id)
            .single();

        if (!existing) throw new Error('Comment not found');
        if (existing.author_id !== user.id && role !== 'admin') throw new Error('Not authorized');

        const { error } = await supabase.from('forum_comments').delete().eq('id', id);
        if (error) throw error;
    },

    // ---------- Likes (toggle) ----------

    async togglePostLike(postId: string): Promise<{ liked: boolean }> {
        const user = await requireUser();

        const { data: existing } = await supabase
            .from('forum_post_likes')
            .select('post_id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('forum_post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);
            if (error) throw error;
            return { liked: false };
        }

        const { error } = await supabase
            .from('forum_post_likes')
            .insert([{ post_id: postId, user_id: user.id }]);
        if (error) throw error;
        return { liked: true };
    },

    async toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
        const user = await requireUser();

        const { data: existing } = await supabase
            .from('forum_comment_likes')
            .select('comment_id')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('forum_comment_likes')
                .delete()
                .eq('comment_id', commentId)
                .eq('user_id', user.id);
            if (error) throw error;
            return { liked: false };
        }

        const { error } = await supabase
            .from('forum_comment_likes')
            .insert([{ comment_id: commentId, user_id: user.id }]);
        if (error) throw error;
        return { liked: true };
    },

    // ---------- Reports / Moderation ----------

    async reportContent(input: { target_type: ForumReportTargetType; target_id: string; reason: string }): Promise<void> {
        const user = await requireUser();
        const validated = forumReportSchema.parse(input);

        const { error } = await supabase
            .from('forum_reports')
            .insert([{
                target_type: validated.target_type,
                target_id: validated.target_id,
                reporter_id: user.id,
                reason: validated.reason,
            }]);

        if (error) throw error;
    },

    async getForumReports(includeResolved = false): Promise<ForumReport[]> {
        await requireAdmin();

        let query = supabase
            .from('forum_reports')
            .select(`
                *,
                reporter:profiles!forum_reports_reporter_id_fkey(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (!includeResolved) query = query.eq('resolved', false);

        const { data, error } = await query;
        if (error) throw error;
        return data as ForumReport[];
    },

    async resolveForumReport(id: string): Promise<void> {
        await requireAdmin();
        const { error } = await supabase
            .from('forum_reports')
            .update({ resolved: true })
            .eq('id', id);
        if (error) throw error;
    },

    /** Admin: hide a post or comment from public view without hard-deleting. */
    async setRemoved(targetType: ForumReportTargetType, targetId: string, removed: boolean): Promise<void> {
        await requireAdmin();
        const table = targetType === 'post' ? 'forum_posts' : 'forum_comments';
        const { error } = await supabase
            .from(table)
            .update({ is_removed: removed })
            .eq('id', targetId);
        if (error) throw error;
    },

    /** Admin: list removed comments for moderation. */
    async getRemovedComments(limit = 50): Promise<ForumComment[]> {
        await requireAdmin();
        const { data, error } = await supabase
            .from('forum_comments')
            .select('*, author:profiles!forum_comments_author_id_fkey(full_name, avatar_url)')
            .eq('is_removed', true)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data as ForumComment[];
    },

    /** Admin: pin/unpin a post. */
    async setPinned(postId: string, pinned: boolean): Promise<void> {
        await requireAdmin();
        const { error } = await supabase
            .from('forum_posts')
            .update({ is_pinned: pinned })
            .eq('id', postId);
        if (error) throw error;
    },
};
