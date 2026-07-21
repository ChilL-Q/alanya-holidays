import { ForumCategory, ForumPost, ForumComment, ForumReport, ForumReportTargetType, ForumEvent, EventAttendee } from '../../../types/models';

export type ForumSort = 'new' | 'top';

export interface ForumPostFilters {
    categorySlug?: string;
    sort?: ForumSort;
    limit?: number;
    offset?: number;
    includeRemoved?: boolean;
    removedOnly?: boolean;
    postType?: 'discussion' | 'question';
}

export interface ForumEventFilters {
    upcomingOnly?: boolean;
    limit?: number;
    includeUnpublished?: boolean;
}

export interface IForumRepository {
  getForumCategories(): Promise<ForumCategory[]>;
  getForumCategoryTree(): Promise<ForumCategory[]>;
  getForumCategory(slug: string): Promise<ForumCategory | null>;
  createForumCategory(input: { name: string; description?: string; sort_order?: number; parent_id?: string | null }): Promise<ForumCategory>;
  updateForumCategory(id: string, updates: { name?: string; description?: string; sort_order?: number; parent_id?: string | null }): Promise<ForumCategory>;
  deleteForumCategory(id: string): Promise<void>;
  getForumPosts(filters?: ForumPostFilters): Promise<{ data: ForumPost[]; total: number }>;
  getHotPosts(limit?: number): Promise<ForumPost[]>;
  getForumPost(slug: string): Promise<ForumPost | null>;
  createForumPost(input: { title: string; body: string; category_id?: string }): Promise<ForumPost>;
  createQuestionPost(input: { title: string; body: string; category_id?: string }): Promise<ForumPost>;
  updateForumPost(id: string, updates: { title?: string; body?: string; category_id?: string | null }): Promise<ForumPost>;
  deleteForumPost(id: string): Promise<void>;
  incrementPostView(postId: string): Promise<void>;
  togglePostLike(postId: string): Promise<{ liked: boolean }>;
  setPinned(postId: string, pinned: boolean): Promise<void>;
  setRemoved(targetType: ForumReportTargetType, targetId: string, removed: boolean): Promise<void>;
  getForumComments(postId: string, options?: { includeRemoved?: boolean }): Promise<ForumComment[]>;
  createForumComment(postId: string, body: string): Promise<ForumComment>;
  deleteForumComment(id: string): Promise<void>;
  toggleCommentLike(commentId: string): Promise<{ liked: boolean }>;
  getRemovedComments(limit?: number): Promise<ForumComment[]>;
  reportContent(input: { target_type: ForumReportTargetType; target_id: string; reason: string }): Promise<void>;
  getForumReports(includeResolved?: boolean): Promise<ForumReport[]>;
  resolveForumReport(id: string): Promise<void>;
  getForumStats(): Promise<{ members: number; discussions: number; replies: number }>;
}

export interface IForumEventsRepository {
  getForumEvents(filters?: ForumEventFilters): Promise<ForumEvent[]>;
  getForumEvent(slug: string): Promise<ForumEvent | null>;
  createForumEvent(input: {
        title: string;
        event_date: string;
        description?: string;
        location?: string;
        image_url?: string;
        host_id?: string | null;
        category_id?: string | null;
        is_published?: boolean;
    }): Promise<ForumEvent>;
  updateForumEvent(id: string, updates: Partial<{
        title: string;
        description: string;
        location: string;
        event_date: string;
        image_url: string;
        host_id: string | null;
        category_id: string | null;
        is_published: boolean;
    }>): Promise<ForumEvent>;
  deleteForumEvent(id: string): Promise<void>;
  getEventAttendees(eventId: string): Promise<EventAttendee[]>;
  toggleEventRsvp(eventId: string, contactPhone?: string | null): Promise<{ going: boolean }>;
}
