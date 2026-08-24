export interface BlogPostAuthor {
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface RawBlogPostTagRelation {
  tag: BlogTag | null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  category: string | null;
  status: 'draft' | 'published' | 'archived' | (string & {});
  is_featured: boolean;
  view_count?: number;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: BlogPostAuthor | null;
  tags?: BlogTag[];
}

export interface RawBlogPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  category: string | null;
  status: string;
  is_featured: boolean;
  view_count?: number;
  author_id: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: BlogPostAuthor | null;
  tags?: RawBlogPostTagRelation[];
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  published_at: string | null;
  author?: BlogPostAuthor | null;
}

export interface BlogPostsListResult {
  data: BlogPost[];
  total: number;
}

export interface BlogSubmissionUser {
  full_name: string | null;
  email: string | null;
}

export interface BlogSubmission {
  id: string;
  user_id: string;
  title: string;
  content: string;
  author_name?: string | null;
  author_email?: string | null;
  category?: string | null;
  video_url?: string | null;
  media_urls?: string[];
  status: 'pending_review' | 'approved' | 'rejected' | (string & {});
  payment_details?: Record<string, unknown> | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  user?: BlogSubmissionUser | null;
}

export interface InsertBlogPostPayload {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  video_url?: string | null;
  cover_image_url?: string | null;
  author_id: string;
  category?: string | null;
  status: string;
  is_featured: boolean;
  published_at: string | null;
}

export interface UpdateBlogPostPayload {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string | null;
  video_url?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
  status?: string;
  is_featured?: boolean;
  published_at?: string;
}

export interface InsertBlogPostTagRow {
  post_id: string;
  tag_id: string;
}

export interface InsertBlogSubmissionPayload {
  user_id: string;
  title: string;
  content: string;
  author_name?: string;
  author_email?: string;
  category?: string;
  video_url?: string | null;
  media_urls?: string[];
  status: string;
  payment_details?: Record<string, unknown> | null;
}

export interface GetBlogPostsFilter {
  page?: number;
  limit?: number;
  offset?: number;
  category?: string;
  tag?: string;
  search?: string;
  status?: string;
  authorId?: string;
  is_featured?: string;
}

export interface GetBlogSubmissionsFilter {
  status?: string;
  userId?: string;
}

export interface InsertNotificationPayload {
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  link?: string;
}

export interface EmailNotificationPayload {
  to: string;
  type: string;
  data: Record<string, unknown>;
}

export interface SuccessResponse {
  success: boolean;
}

export interface SubmissionCreatedResponse {
  submissionId: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  like_count: number;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
  author?: BlogPostAuthor | null;
  isLiked?: boolean;
  children?: BlogComment[];
}

export interface InsertBlogCommentPayload {
  post_id: string;
  user_id: string;
  body: string;
  parent_id?: string | null;
}
