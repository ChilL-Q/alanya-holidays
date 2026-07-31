export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
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

  // Virtual / joined fields
  author?: { full_name: string | null; avatar_url: string | null };
  tags?: BlogTag[];
}

export interface BlogPostTag {
  post_id: string;
  tag_id: string;
}

export type BlogSubmissionStatus = 'pending_review' | 'approved' | 'rejected';

export interface BlogSubmission {
  id: string;
  user_id: string;
  title: string;
  content: string;
  video_url: string | null;
  media_urls: string[];
  status: BlogSubmissionStatus;
  payment_details: string | null;
  rejection_reason: string | null;
  created_at: string | null;

  // Virtual / joined
  user?: { full_name: string | null; email: string | null };
}
