export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number | null;
  parent_id?: string | null;
  icon?: string | null;
  image_url?: string | null;
  accent?: string | null;
  created_at?: string;
  parent?: ForumCategory | null;
  children?: ForumCategory[];
  topic_count?: number;
  discussion_count?: number;
}

export interface ForumPostAuthor {
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  role?: string | null;
  created_at?: string | null;
}

export interface ForumPost {
  id: string;
  title: string;
  slug: string;
  body?: string;
  content?: string;
  category_id?: string | null;
  category?: ForumCategory | null;
  image_url?: string | null;
  author_id: string;
  author?: ForumPostAuthor | null;
  pinned?: boolean;
  is_pinned?: boolean;
  is_removed?: boolean;
  like_count?: number;
  likes_count?: number;
  comment_count?: number;
  comments_count?: number;
  view_count?: number;
  views_count?: number;
  liked_by_me?: boolean;
  bookmarked_by_me?: boolean;
  post_type?: 'announcement' | 'discussion' | 'question';
  created_at: string;
  updated_at?: string;
}

export interface ForumComment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  body?: string;
  content?: string;
  author_id: string;
  author?: ForumPostAuthor | null;
  like_count?: number;
  likes_count?: number;
  liked_by_me?: boolean;
  is_removed?: boolean;
  created_at: string;
  updated_at?: string;
  children?: ForumComment[];
  post?: {
    title: string;
    slug: string;
  } | null;
}

export interface ForumEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  event_date: string;
  image_url?: string | null;
  host_id?: string | null;
  host?: ForumPostAuthor | null;
  category_id?: string | null;
  category?: Partial<ForumCategory> | null;
  is_published?: boolean;
  created_by?: string;
  going_by_me?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ForumEventAttendee {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  rsvp_at?: string | null;
  contact_phone?: string | null;
  [key: string]: unknown;
}

export type ForumReportTargetType = 'post' | 'comment';

export interface ForumReport {
  id: string;
  target_type: ForumReportTargetType;
  target_id: string;
  reporter_id: string;
  reporter?: ForumPostAuthor | null;
  reason: string;
  resolved: boolean;
  created_at: string;
  target_missing?: boolean;
  target_post?: {
    id: string;
    title?: string;
    content?: string;
    author_id?: string;
    is_pinned?: boolean;
    is_removed?: boolean;
    created_at?: string;
  } | null;
  target_comment?: {
    id: string;
    post_id?: string;
    body?: string;
    author_id?: string;
    user_id?: string;
    is_removed?: boolean;
    created_at?: string;
  } | null;
}

export interface ForumPostsFilter {
  categorySlug?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  includeRemoved?: boolean;
  removedOnly?: boolean;
  postType?: 'announcement' | 'discussion' | 'question';
  authorId?: string;
  search?: string;
}

export interface ForumPostsRepoFilter extends ForumPostsFilter {
  categoryIds?: string[];
}

export interface ForumEventsFilter {
  upcomingOnly?: boolean;
  limit?: number;
  includeUnpublished?: boolean;
  search?: string;
  ownerId?: string;
}

export interface ForumCommentsFilter {
  includeRemoved?: boolean;
  limit?: number;
  offset?: number;
}

export interface InsertForumPostDbInput {
  title: string;
  slug: string;
  body?: string;
  content?: string;
  category_id?: string | null;
  image_url?: string | null;
  author_id: string;
  post_type?: 'announcement' | 'discussion' | 'question';
}

export interface UpdateForumPostDbInput {
  title?: string;
  slug?: string;
  body?: string;
  content?: string;
  category_id?: string | null;
  image_url?: string | null;
  is_pinned?: boolean;
  is_removed?: boolean;
}

export interface InsertForumCommentDbInput {
  post_id: string;
  author_id: string;
  body?: string;
  content?: string;
  parent_id?: string | null;
}

export interface InsertForumCategoryDbInput {
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
  parent_id?: string | null;
  icon?: string | null;
  image_url?: string | null;
  accent?: string | null;
}

export interface UpdateForumCategoryDbInput {
  name?: string;
  slug?: string;
  description?: string | null;
  sort_order?: number;
  parent_id?: string | null;
  icon?: string | null;
  image_url?: string | null;
  accent?: string | null;
}

export interface InsertForumEventDbInput {
  title: string;
  slug: string;
  description?: string | null;
  location?: string | null;
  event_date: string;
  image_url?: string | null;
  host_id?: string | null;
  category_id?: string | null;
  is_published?: boolean;
  created_by?: string;
}

export interface UpdateForumEventDbInput {
  title?: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  event_date?: string;
  image_url?: string | null;
  host_id?: string | null;
  category_id?: string | null;
  is_published?: boolean;
}

export interface InsertForumEventRsvpDbInput {
  event_id: string;
  user_id: string;
  contact_phone?: string | null;
}

export interface InsertForumReportDbInput {
  target_type: ForumReportTargetType;
  target_id: string;
  reporter_id: string;
  reason: string;
}

export interface ForumPaginatedResult<T> {
  data: T[];
  total: number;
}

export interface ForumActionResponse {
  success: boolean;
}

export interface ForumLikeResponse {
  liked: boolean;
}

export interface ForumRsvpResponse {
  going: boolean;
}

export interface ForumStatsResponse {
  totalTopics: number;
  totalReplies: number;
  totalMembers: number;
  usersOnline: number;
  latestMember: string | null;
}
