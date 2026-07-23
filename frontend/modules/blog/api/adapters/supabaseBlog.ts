import { supabase } from '../../../../api-services/supabase';
import { BlogPost, BlogTag, BlogSubmission } from '../../../../types/models';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
}

async function buildQueryParams(params: any) {
    const p = new URLSearchParams();
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            p.append(key, String(params[key]));
        }
    }
    return p.toString();
}

import { IBlogRepository, BlogPostFilters, BlogPostWithTags, BlogPostPreview } from '../types';

import { fetchJson } from '../../../../api-services/api/fetchHelper';

export const supabaseBlogService: IBlogRepository = {
    async getBlogPosts(filters: BlogPostFilters = {}): Promise<{ data: BlogPostWithTags[]; total: number }> {
        const headers = await getAuthHeaders();
        const qs = await buildQueryParams(filters);
        return fetchJson(`/api/blog?${qs}`, { headers });
    },

    async getFeaturedBlogPosts(limit: number = 3): Promise<BlogPostPreview[]> {
        return fetchJson<BlogPostPreview[]>(`/api/blog/featured?limit=${limit}`).catch(() => []);
    },

    async getBlogPost(slug: string, incrementViews: boolean = true): Promise<BlogPostWithTags | null> {
        try {
            return await fetchJson<BlogPostWithTags>(`/api/blog/post/${slug}?incrementViews=${incrementViews}`);
        } catch (err) {
            if (err instanceof Error && err.message.includes('404')) return null;
            throw err;
        }
    },

    async getRelatedPosts(postId: string, category: string | null, limit: number = 3): Promise<BlogPostPreview[]> {
        const cleanCat = category ? encodeURIComponent(category.trim()) : '';
        return fetchJson<BlogPostPreview[]>(`/api/blog/related/${postId}?category=${cleanCat}&limit=${limit}`).catch(() => []);
    },

    async createBlogPost(data: any): Promise<BlogPost> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/blog', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create post');
        return res.json();
    },

    async updateBlogPost(id: string, updates: any): Promise<BlogPost> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/${id}`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update post');
        return res.json();
    },

    async deleteBlogPost(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete post');
    },

    // Tags
    async getBlogTags(): Promise<BlogTag[]> {
        const res = await fetch('/api/blog/tags');
        if (!res.ok) throw new Error('Failed to fetch tags');
        return res.json();
    },

    async createBlogTag(name: string): Promise<BlogTag> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/blog/tags', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to create tag');
        return res.json();
    },

    async deleteBlogTag(id: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/tags/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to delete tag');
    },

    async addTagToPost(postId: string, tagId: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/${postId}/tags/${tagId}`, { method: 'POST', headers });
        if (!res.ok) throw new Error('Failed to add tag');
    },

    async removeTagFromPost(postId: string, tagId: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/${postId}/tags/${tagId}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Failed to remove tag');
    },

    // Submissions
    async createBlogSubmission(data: any): Promise<{ submissionId: string }> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/blog/submissions', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Failed to create submission' }));
            throw new Error(err.message || 'Failed to create submission');
        }
        return res.json();
    },

    async getBlogSubmissions(filters?: { status?: string; userId?: string }): Promise<BlogSubmission[]> {
        const headers = await getAuthHeaders();
        const qs = await buildQueryParams(filters || {});
        const res = await fetch(`/api/blog/submissions/admin?${qs}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch submissions');
        return res.json();
    },

    async getUserBlogSubmissions(): Promise<BlogSubmission[]> {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/blog/submissions/me', { headers });
        if (!res.ok) throw new Error('Failed to fetch user submissions');
        return res.json();
    },

    async approveBlogSubmission(submissionId: string): Promise<BlogPost> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/submissions/${submissionId}/approve`, {
            method: 'PATCH',
            headers
        });
        if (!res.ok) throw new Error('Failed to approve submission');
        return res.json();
    },

    async rejectBlogSubmission(submissionId: string, reason: string): Promise<void> {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/blog/submissions/${submissionId}/reject`, {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (!res.ok) throw new Error('Failed to reject submission');
    }
};
