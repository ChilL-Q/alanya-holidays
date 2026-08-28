import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumEventService } from './application/forum-event.service';
import { ForumReportService } from './application/forum-report.service';
import { UsersService } from '../users/users.service';
import { ModerationAuditService } from '../admin/moderation-audit.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  CreateForumCategoryDto,
  UpdateForumCategoryDto,
} from './dto/forum-categories.dto';
import {
  CreateForumPostDto,
  GetForumPostsQueryDto,
  SetPinnedDto,
  SetRemovedDto,
  UpdateForumPostDto,
} from './dto/forum-posts.dto';
import {
  CreateForumCommentDto,
  GetForumCommentsQueryDto,
  UpdateForumCommentDto,
} from './dto/forum-comments.dto';
import {
  CreateForumEventDto,
  GetForumEventsQueryDto,
  ToggleEventRsvpDto,
  UpdateForumEventDto,
} from './dto/forum-events.dto';
import { LimitQueryDto } from '../common/dto/pagination.dto';
import {
  ForumActionResponse,
  ForumCategory,
  ForumComment,
  ForumEvent,
  ForumEventAttendee,
  ForumEventsFilter,
  ForumLikeResponse,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsFilter,
  ForumRsvpResponse,
  ForumStatsResponse,
} from './types/forum.types';

@Controller('forum')
export class ForumController {
  constructor(
    private readonly discussionService: ForumDiscussionService,
    private readonly eventService: ForumEventService,
    private readonly reportService: ForumReportService,
    private readonly usersService: UsersService,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
  ) {}

  // ============================================================
  // Categories (/forum/categories*)
  // ============================================================
  @Get('categories')
  async getForumCategories(): Promise<ForumCategory[]> {
    return this.discussionService.getForumCategories();
  }

  @Get('categories/tree')
  async getForumCategoryTree(): Promise<ForumCategory[]> {
    return this.discussionService.getForumCategoryTree();
  }

  @Get('categories/slug/:slug')
  async getForumCategory(
    @Param('slug') slug: string,
  ): Promise<ForumCategory | null> {
    return this.discussionService.getForumCategory(slug);
  }

  @Post('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async createForumCategory(
    @Body() body: CreateForumCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumCategory> {
    return this.discussionService.createForumCategory(body, user.id);
  }

  @Put('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updateForumCategory(
    @Param('id') id: string,
    @Body() body: UpdateForumCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumCategory> {
    return this.discussionService.updateForumCategory(id, body, user.id);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteForumCategory(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumCategory(id, user.id);
  }

  // ============================================================
  // Posts (/forum/posts*)
  // ============================================================
  @Get('posts')
  @UseGuards(OptionalAuthGuard)
  async getForumPosts(
    @Query() query: GetForumPostsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumPaginatedResult<ForumPost>> {
    const filters: ForumPostsFilter = {
      categorySlug: query.categorySlug,
      sort: query.sort,
      limit: query.limit !== undefined ? Number(query.limit) : 20,
      offset: query.offset !== undefined ? Number(query.offset) : 0,
      includeRemoved:
        query.includeRemoved === true ||
        (query.includeRemoved as unknown) === 'true',
      removedOnly:
        query.removedOnly === true || (query.removedOnly as unknown) === 'true',
      postType: query.postType,
      authorId: query.authorId,
      search: query.search,
    };
    return this.discussionService.getForumPosts(filters, user?.id);
  }

  @Get('posts/hot')
  @UseGuards(OptionalAuthGuard)
  async getHotPosts(
    @Query() query?: LimitQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumPost[]> {
    return this.discussionService.getHotPosts(query?.limit ?? 8, user?.id);
  }

  @Get('posts/slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumPost(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumPost | null> {
    return this.discussionService.getForumPost(slug, user?.id);
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  async createForumPost(
    @Body() body: CreateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.discussionService.createForumPost(body, 'discussion', user.id);
  }

  @Post('questions')
  @UseGuards(AuthGuard)
  async createQuestionPost(
    @Body() body: CreateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.discussionService.createForumPost(body, 'question', user.id);
  }

  @Put('posts/:id')
  @UseGuards(AuthGuard)
  async updateForumPost(
    @Param('id') id: string,
    @Body() body: UpdateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.discussionService.updateForumPost(id, body, user.id);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard)
  async deleteForumPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumPost(id, user.id);
  }

  @Post('posts/:id/view')
  async incrementPostView(
    @Param('id') id: string,
  ): Promise<ForumActionResponse> {
    return this.discussionService.incrementPostView(id);
  }

  @Post('posts/:id/like')
  @UseGuards(AuthGuard)
  async togglePostLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumLikeResponse> {
    return this.discussionService.togglePostLike(id, user.id);
  }

  @Post('posts/:id/pin')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async setPinned(
    @Param('id') id: string,
    @Body() body: SetPinnedDto | { pinned: boolean } | boolean,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    const pinned =
      typeof body === 'object' && body !== null && 'pinned' in body
        ? Boolean(body.pinned)
        : Boolean(body);
    const result = await this.discussionService.setPinned(id, pinned, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'forum_post',
        entity_id: id,
        action: pinned ? 'pin' : 'unpin',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Post('posts/:id/remove')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async setPostRemoved(
    @Param('id') id: string,
    @Body() body: SetRemovedDto | { removed: boolean } | boolean,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    const removed =
      typeof body === 'object' && body !== null && 'removed' in body
        ? Boolean(body.removed)
        : Boolean(body);
    const result = await this.discussionService.setRemoved(
      'post',
      id,
      removed,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'forum_post',
        entity_id: id,
        action: removed ? 'remove' : 'restore',
        admin_id: user.id,
      });
    }
    return result;
  }

  // ============================================================
  // Bookmarks (/forum/bookmarks*)
  // ============================================================
  @Get('bookmarks')
  @UseGuards(AuthGuard)
  async getUserBookmarks(@CurrentUser() user: AuthUser): Promise<ForumPost[]> {
    return this.discussionService.getUserBookmarks(user.id);
  }

  @Post('posts/:id/bookmark')
  @UseGuards(AuthGuard)
  async togglePostBookmark(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ bookmarked: boolean }> {
    return this.discussionService.togglePostBookmark(id, user.id);
  }

  // ============================================================
  // Comments (/forum/comments*)
  // ============================================================
  @Get('comments/post/:postId')
  @UseGuards(OptionalAuthGuard)
  async getForumComments(
    @Param('postId') postId: string,
    @Query() query: GetForumCommentsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumComment[]> {
    return this.discussionService.getForumComments(
      postId,
      {
        includeRemoved:
          query.includeRemoved === true ||
          (query.includeRemoved as unknown) === 'true',
        limit: query.limit ?? 20,
        offset: query.offset ?? 0,
      },
      user?.id,
    );
  }

  @Post('comments/post/:postId')
  @UseGuards(AuthGuard)
  async createForumComment(
    @Param('postId') postId: string,
    @Body() body: CreateForumCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumComment> {
    const text = body.body || body.content || '';
    return this.discussionService.createForumComment(
      postId,
      text,
      user.id,
      body.parentId || body.parent_id || null,
    );
  }

  @Put('comments/:id')
  @UseGuards(AuthGuard)
  async updateForumComment(
    @Param('id') id: string,
    @Body() body: UpdateForumCommentDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumComment> {
    const text = body.body ?? body.content ?? '';
    return this.discussionService.updateForumComment(id, text, user.id);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  async deleteForumComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.discussionService.deleteForumComment(id, user.id);
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  async toggleCommentLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumLikeResponse> {
    return this.discussionService.toggleCommentLike(id, user.id);
  }

  @Post('comments/:id/remove')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async setCommentRemoved(
    @Param('id') id: string,
    @Body() body: SetRemovedDto | { removed: boolean } | boolean,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    const removed =
      typeof body === 'object' && body !== null && 'removed' in body
        ? Boolean(body.removed)
        : Boolean(body);
    const result = await this.discussionService.setRemoved(
      'comment',
      id,
      removed,
      user.id,
    );
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'forum_comment',
        entity_id: id,
        action: removed ? 'remove' : 'restore',
        admin_id: user.id,
      });
    }
    return result;
  }

  // ============================================================
  // Events (/forum/events*)
  // ============================================================
  @Get('events')
  @UseGuards(OptionalAuthGuard)
  async getForumEvents(
    @Query() query: GetForumEventsQueryDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumEvent[]> {
    const filters: ForumEventsFilter = {
      upcomingOnly:
        query.upcomingOnly === true ||
        (query.upcomingOnly as unknown) === 'true',
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      includeUnpublished:
        query.includeUnpublished === true ||
        (query.includeUnpublished as unknown) === 'true',
      search: query.search,
    };
    return this.eventService.getForumEvents(filters, user?.id);
  }

  @Get('events/slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumEvent(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumEvent | null> {
    return this.eventService.getForumEvent(slug, user?.id);
  }

  @Post('events')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async createForumEvent(
    @Body() body: CreateForumEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEvent> {
    return this.eventService.createForumEvent(body, user.id);
  }

  @Put('events/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updateForumEvent(
    @Param('id') id: string,
    @Body() body: UpdateForumEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEvent> {
    return this.eventService.updateForumEvent(id, body, user.id);
  }

  @Delete('events/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteForumEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.eventService.deleteForumEvent(id, user.id);
  }

  @Get('events/:id/attendees')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getEventAttendees(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEventAttendee[]> {
    return this.eventService.getEventAttendees(id, user.id);
  }

  @Post('events/:id/rsvp')
  @UseGuards(AuthGuard)
  async toggleEventRsvp(
    @Param('id') id: string,
    @Body() body: ToggleEventRsvpDto | { contactPhone?: string | null },
    @CurrentUser() user: AuthUser,
  ): Promise<ForumRsvpResponse> {
    const contactPhone =
      typeof body === 'object' && body !== null && 'contactPhone' in body
        ? (body.contactPhone as string | null)
        : typeof body === 'string'
          ? body
          : null;
    return this.eventService.toggleEventRsvp(id, contactPhone, user.id);
  }

  // ============================================================
  // Stats (/forum/stats)
  // ============================================================
  @Get('stats')
  async getForumStats(): Promise<ForumStatsResponse> {
    return this.discussionService.getForumStats();
  }

  // ============================================================
  // Members (/forum/members)
  // ============================================================
  @Get('members')
  getForumMembers(
    @Query() query?: LimitQueryDto,
    @Query('onlineOnly') onlineOnly?: string,
  ): Promise<Record<string, unknown>[]> {
    return this.usersService.getForumMembers(
      query?.limit,
      onlineOnly === 'true',
    );
  }

  @Get('members/:id')
  getForumMemberById(
    @Param('id') id: string,
  ): Promise<Record<string, unknown>> {
    return this.usersService.getForumMemberById(id);
  }
}
