import { SocialLinks } from './common';

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string | null;
  parent_id?: string | null;
  icon?: string | null;
  image_url?: string | null;
  accent?: string | null;

  // Virtual / joined
  parent?: Pick<ForumCategory, 'id' | 'name' | 'slug'> | null;
  children?: ForumCategory[];
  /** Total discussions in this category (incl. subcategories). */
  discussion_count?: number;
  /** Number of subcategories ("topics"). */
  topic_count?: number;
}

export interface ForumAuthor {
  full_name: string | null;
  avatar_url: string | null;
}

export interface ForumPost {
  id: string;
  title: string;
  slug: string;
  body: string | null;
  category_id: string | null;
  author_id: string | null;
  post_type: 'discussion' | 'question';
  like_count: number;
  comment_count: number;
  view_count: number;
  is_pinned: boolean;
  is_removed: boolean;
  created_at: string | null;
  updated_at: string | null;

  // Virtual / joined
  category?: ForumCategory | null;
  author?: ForumAuthor | null;
  liked_by_me?: boolean;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string | null;
  body: string;
  like_count: number;
  is_removed: boolean;
  created_at: string | null;

  // Virtual / joined
  author?: ForumAuthor | null;
  liked_by_me?: boolean;
}

export interface ForumEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  event_date: string;
  image_url: string | null;
  host_id: string | null;
  category_id: string | null;
  attendee_count: number;
  is_published: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Virtual / joined
  host?: ForumAuthor | null;
  category?: Pick<ForumCategory, 'id' | 'name' | 'slug'> | null;
  going_by_me?: boolean;
}

/** A community member as surfaced on the Members directory. */
export interface ForumMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
  last_seen_at: string | null;
  social_links?: SocialLinks | null;
  post_count: number;
  is_online: boolean;
}

/** An RSVP'd attendee with contact details — admin-only. */
export interface EventAttendee {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  social_links?: SocialLinks | null;
  /** Number the attendee left at RSVP time (e.g. WhatsApp). */
  contact_phone: string | null;
  rsvp_at: string | null;
}

export type ForumReportTargetType = 'post' | 'comment';

export interface ForumReport {
  id: string;
  target_type: ForumReportTargetType;
  target_id: string;
  reporter_id: string | null;
  reason: string;
  resolved: boolean;
  created_at: string | null;

  // Virtual / joined
  reporter?: { full_name: string | null; email: string | null } | null;
}
