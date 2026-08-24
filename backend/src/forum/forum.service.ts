import { Injectable, Optional } from '@nestjs/common';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumEventService } from './application/forum-event.service';
import { ForumReportService } from './application/forum-report.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from './dto/forum-categories.dto';
import { CreateForumPostDto, UpdateForumPostDto } from './dto/forum-posts.dto';
import {
  CreateForumEventDto,
  UpdateForumEventDto,
} from './dto/forum-events.dto';
import { CreateForumReportDto } from './dto/forum-reports.dto';
import {
  ForumActionResponse,
  ForumCategory,
  ForumComment,
  ForumCommentsFilter,
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  ForumLikeResponse,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsFilter,
  ForumReport,
  ForumRsvpResponse,
  ForumStatsResponse,
} from './types/forum.types';

@Injectable()
export class ForumService {
  private readonly discussionService!: ForumDiscussionService;
  private readonly eventService!: ForumEventService;
  private readonly reportService!: ForumReportService;

  constructor(
    @Optional() forumDiscussionService?: ForumDiscussionService,
    @Optional() forumEventService?: ForumEventService,
    @Optional() forumReportService?: ForumReportService,
    @Optional() forumRepository?: ForumRepository,
    @Optional() userRolesRepo?: UserRolesRepository,
  ) {
    if (forumDiscussionService && forumEventService && forumReportService) {
      this.discussionService = forumDiscussionService;
      this.eventService = forumEventService;
      this.reportService = forumReportService;
    } else if (forumRepository) {
      this.discussionService =
        forumDiscussionService ??
        new ForumDiscussionService(forumRepository, userRolesRepo);
      this.eventService =
        forumEventService ??
        new ForumEventService(forumRepository, userRolesRepo);
      this.reportService =
        forumReportService ??
        new ForumReportService(forumRepository, userRolesRepo);
    }
  }

  // ============================================================
  // Categories Delegation
  // ============================================================
  async getForumCategories(): Promise<ForumCategory[]> {
    return this.discussionService.getForumCategories();
  }

  async getForumCategoryTree(): Promise<ForumCategory[]> {
    return this.discussionService.getForumCategoryTree();
  }

  async getForumCategory(slug: string): Promise<ForumCategory | null> {
    return this.discussionService.getForumCategory(slug);
  }

  async createForumCategory(
    input: CreateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    return this.discussionService.createForumCategory(input, userId);
  }

  async updateForumCategory(
    id: string,
    updates: UpdateForumCategoryDto,
    userId: string,
  ): Promise<ForumCategory> {
    return this.discussionService.updateForumCategory(id, updates, userId);
  }

  async deleteForumCategory(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumCategory(id, userId);
  }

  // ============================================================
  // Posts Delegation
  // ============================================================
  async getForumPosts(
    filters: ForumPostsFilter,
    userId?: string,
  ): Promise<ForumPaginatedResult<ForumPost>> {
    return this.discussionService.getForumPosts(filters, userId);
  }

  async getHotPosts(limit = 8, userId?: string): Promise<ForumPost[]> {
    return this.discussionService.getHotPosts(limit, userId);
  }

  async getForumPost(slug: string, userId?: string): Promise<ForumPost | null> {
    return this.discussionService.getForumPost(slug, userId);
  }

  async createForumPost(
    input: CreateForumPostDto,
    postType: 'discussion' | 'question',
    userId: string,
  ): Promise<ForumPost> {
    return this.discussionService.createForumPost(input, postType, userId);
  }

  async updateForumPost(
    id: string,
    updates: UpdateForumPostDto,
    userId: string,
  ): Promise<ForumPost> {
    return this.discussionService.updateForumPost(id, updates, userId);
  }

  async deleteForumPost(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumPost(id, userId);
  }

  async incrementPostView(id: string): Promise<ForumActionResponse> {
    return this.discussionService.incrementPostView(id);
  }

  async setPinned(
    id: string,
    pinned: boolean,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.setPinned(id, pinned, userId);
  }

  async setRemoved(
    targetType: 'post' | 'comment',
    id: string,
    removed: boolean,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.setRemoved(targetType, id, removed, userId);
  }

  // ============================================================
  // Comments Delegation
  // ============================================================
  async getForumComments(
    postId: string,
    options: ForumCommentsFilter,
    userId?: string,
  ): Promise<ForumComment[]> {
    return this.discussionService.getForumComments(postId, options, userId);
  }

  async createForumComment(
    postId: string,
    body: string,
    userId: string,
    parentId?: string | null,
  ): Promise<ForumComment> {
    return this.discussionService.createForumComment(
      postId,
      body,
      userId,
      parentId,
    );
  }

  async updateForumComment(
    id: string,
    body: string,
    userId: string,
  ): Promise<ForumComment> {
    return this.discussionService.updateForumComment(id, body, userId);
  }

  async deleteForumComment(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumComment(id, userId);
  }

  async getRemovedComments(
    limit = 50,
    userId: string,
  ): Promise<ForumComment[]> {
    return this.discussionService.getRemovedComments(limit, userId);
  }

  // ============================================================
  // Likes Delegation
  // ============================================================
  async togglePostLike(
    postId: string,
    userId: string,
  ): Promise<ForumLikeResponse> {
    return this.discussionService.togglePostLike(postId, userId);
  }

  async toggleCommentLike(
    commentId: string,
    userId: string,
  ): Promise<ForumLikeResponse> {
    return this.discussionService.toggleCommentLike(commentId, userId);
  }

  // ============================================================
  // Events Delegation
  // ============================================================
  async getForumEvents(
    filters: ForumEventsFilter,
    userId?: string,
  ): Promise<ForumEvent[]> {
    return this.eventService.getForumEvents(filters, userId);
  }

  async getForumEvent(
    slug: string,
    userId?: string,
  ): Promise<ForumEvent | null> {
    return this.eventService.getForumEvent(slug, userId);
  }

  async createForumEvent(
    input: CreateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    return this.eventService.createForumEvent(input, userId);
  }

  async updateForumEvent(
    id: string,
    updates: UpdateForumEventDto,
    userId: string,
  ): Promise<ForumEvent> {
    return this.eventService.updateForumEvent(id, updates, userId);
  }

  async deleteForumEvent(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.eventService.deleteForumEvent(id, userId);
  }

  async getEventAttendees(
    eventId: string,
    userId: string,
  ): Promise<ForumEventAttendee[]> {
    return this.eventService.getEventAttendees(eventId, userId);
  }

  async toggleEventRsvp(
    eventId: string,
    contactPhone: string | null,
    userId: string,
  ): Promise<ForumRsvpResponse> {
    return this.eventService.toggleEventRsvp(eventId, contactPhone, userId);
  }

  // ============================================================
  // Reports Delegation
  // ============================================================
  async reportContent(
    input: CreateForumReportDto,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.reportService.reportContent(input, userId);
  }

  async getForumReports(
    options:
      | {
          includeResolved?: boolean;
          page?: number;
          limit?: number;
          target_type?: 'post' | 'comment';
        }
      | boolean,
    userId: string,
  ): Promise<ForumReport[]> {
    return this.reportService.getForumReports(options, userId);
  }

  async resolveForumReport(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    return this.reportService.resolveForumReport(id, userId);
  }

  // ============================================================
  // Bookmarks Delegation
  // ============================================================
  async getUserBookmarks(userId: string): Promise<ForumPost[]> {
    return this.discussionService.getUserBookmarks(userId);
  }

  async togglePostBookmark(
    postId: string,
    userId: string,
  ): Promise<{ bookmarked: boolean }> {
    return this.discussionService.togglePostBookmark(postId, userId);
  }

  // ============================================================
  // Stats Delegation
  // ============================================================
  async getForumStats(): Promise<ForumStatsResponse> {
    return this.discussionService.getForumStats();
  }
}
