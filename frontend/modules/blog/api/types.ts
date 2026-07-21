import { BlogPost, BlogTag, BlogPostStatus, BlogSubmission } from '../../../types/models';

export interface BlogPostFilters {
    category?: string;
    status?: string;
    is_featured?: boolean;
    authorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface BlogPostWithTags extends BlogPost {
    tags?: BlogTag[];
}

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

export interface IBlogRepository {
  getBlogPosts(filters?: BlogPostFilters): Promise<{ data: BlogPostWithTags[]; total: number }>;
  getFeaturedBlogPosts(limit?: number): Promise<BlogPostPreview[]>;
  getBlogPost(slug: string, incrementViews?: boolean): Promise<BlogPostWithTags | null>;
  getRelatedPosts(postId: string, category: string | null, limit?: number): Promise<BlogPostPreview[]>;
  createBlogPost(data: any): Promise<BlogPost>;
  updateBlogPost(id: string, updates: any): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  getBlogTags(): Promise<BlogTag[]>;
  createBlogTag(name: string): Promise<BlogTag>;
  deleteBlogTag(id: string): Promise<void>;
  addTagToPost(postId: string, tagId: string): Promise<void>;
  removeTagFromPost(postId: string, tagId: string): Promise<void>;
  createBlogSubmission(data: any): Promise<{ submissionId: string }>;
  getBlogSubmissions(filters?: { status?: string; userId?: string }): Promise<BlogSubmission[]>;
  getUserBlogSubmissions(): Promise<BlogSubmission[]>;
  approveBlogSubmission(submissionId: string): Promise<BlogPost>;
  rejectBlogSubmission(submissionId: string, reason: string): Promise<void>;
}
