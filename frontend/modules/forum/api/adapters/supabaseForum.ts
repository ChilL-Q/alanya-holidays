import { supabase } from '../../../../api-services/supabase';
import {
    ForumCategory,
    ForumPost,
    ForumComment,
    ForumReport,
    ForumReportTargetType,
} from '../../../../types/models';





async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

import { IForumRepository, ForumPostFilters } from '../types';

export const supabaseForumService: IForumRepository = {
    // ---------- Categories ----------

    async getForumCategories(): Promise<ForumCategory[]> {
        const res = await fetch('/api/forum/categories');
        if (!res.ok) throw new Error('Failed to fetch forum categories');
        return res.json();
    },

    async getForumCategoryTree(): Promise<ForumCategory[]> {
        const res = await fetch('/api/forum/categories/tree');
        if (!res.ok) throw new Error('Failed to fetch forum category tree');
        return res.json();
    },

    async getForumCategory(slug: string): Promise<ForumCategory | null> {
        const res = await fetch(`/api/forum/categories/slug/${slug}`);
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch forum category');
        }
        return res.json();
    },

    async createForumCategory(input: { name: string; description?: string; sort_order?: number; parent_id?: string | null }): Promise<ForumCategory> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/forum/categories', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Failed to create category');
        return res.json();
    },

    async updateForumCategory(id: string, updates: { name?: string; description?: string; sort_order?: number; parent_id?: string | null }): Promise<ForumCategory> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/categories/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update category');
        return res.json();
    },

    async deleteForumCategory(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/categories/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete category');
    },

    // ---------- Posts ----------

    async getForumPosts(filters: ForumPostFilters = {}): Promise<{ data: ForumPost[]; total: number }> {
        const params = new URLSearchParams();
        if (filters.categorySlug) params.set('categorySlug', filters.categorySlug);
        if (filters.sort) params.set('sort', filters.sort);
        if (filters.limit) params.set('limit', filters.limit.toString());
        if (filters.offset) params.set('offset', filters.offset.toString());
        if (filters.includeRemoved) params.set('includeRemoved', 'true');
        if (filters.removedOnly) params.set('removedOnly', 'true');
        if (filters.postType) params.set('postType', filters.postType);

        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts?${params.toString()}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch forum posts');
        return res.json();
    },

    async getHotPosts(limit = 8): Promise<ForumPost[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/hot?limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch hot posts');
        return res.json();
    },

    async getForumPost(slug: string): Promise<ForumPost | null> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/slug/${slug}`, { headers });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch post');
        }
        return res.json();
    },

    async createForumPost(input: { title: string; body: string; category_id?: string }): Promise<ForumPost> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/forum/posts', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Failed to create post');
        return res.json();
    },

    async createQuestionPost(input: { title: string; body: string; category_id?: string }): Promise<ForumPost> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/forum/posts/question', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Failed to create question post');
        return res.json();
    },

    async updateForumPost(id: string, updates: { title?: string; body?: string; category_id?: string | null }): Promise<ForumPost> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update post');
        return res.json();
    },

    async deleteForumPost(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete post');
    },

    async incrementPostView(postId: string): Promise<void> {
        await fetch(`/api/forum/posts/${postId}/view`, { method: 'POST' });
    },

    async togglePostLike(postId: string): Promise<{ liked: boolean }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/${postId}/like`, { method: 'POST', headers });
        if (!res.ok) throw new Error('Failed to toggle like');
        return res.json();
    },

    async setPinned(postId: string, pinned: boolean): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/posts/${postId}/pin`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinned })
        });
        if (!res.ok) throw new Error('Failed to pin/unpin post');
    },

    async setRemoved(targetType: ForumReportTargetType, targetId: string, removed: boolean): Promise<void> {
        const headers = await getAuthHeaders();
        const endpoint = targetType === 'post' ? `/api/forum/posts/${targetId}/remove` : `/api/forum/comments/${targetId}/remove`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ removed })
        });
        if (!res.ok) throw new Error(`Failed to remove ${targetType}`);
    },

    // ---------- Comments ----------

    async getForumComments(postId: string, options?: { includeRemoved?: boolean }): Promise<ForumComment[]> {
        const headers = await getAuthHeaders();
        const params = options?.includeRemoved ? '?includeRemoved=true' : '';
        const res = await fetch(`/api/forum/comments/post/${postId}${params}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
    },

    async createForumComment(postId: string, body: string): Promise<ForumComment> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/comments/post/${postId}`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ body })
        });
        if (!res.ok) throw new Error('Failed to create comment');
        return res.json();
    },

    async deleteForumComment(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/comments/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete comment');
    },

    async toggleCommentLike(commentId: string): Promise<{ liked: boolean }> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/comments/${commentId}/like`, { method: 'POST', headers });
        if (!res.ok) throw new Error('Failed to toggle like');
        return res.json();
    },

    async getRemovedComments(limit = 50): Promise<ForumComment[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/reports/removed-comments?limit=${limit}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch removed comments');
        return res.json();
    },

    // ---------- Reports / Moderation ----------

    async reportContent(input: { target_type: ForumReportTargetType; target_id: string; reason: string }): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/forum/reports', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        });
        if (!res.ok) throw new Error('Failed to report content');
    },

    async getForumReports(includeResolved = false): Promise<ForumReport[]> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/reports?includeResolved=${includeResolved}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch reports');
        return res.json();
    },

    async resolveForumReport(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/forum/reports/${id}/resolve`, { method: 'POST', headers });
        if (!res.ok) throw new Error('Failed to resolve report');
    },

    // ---------- Stats ----------

    async getForumStats(): Promise<{ members: number; discussions: number; replies: number }> {
        const res = await fetch('/api/forum/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    }
};
