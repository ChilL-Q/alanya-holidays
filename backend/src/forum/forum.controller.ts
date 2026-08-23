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
} from '@nestjs/common';
import { ForumService } from './forum.service';
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
  constructor(private readonly forumService: ForumService) {}

  // ============================================================
  // Categories (/forum/categories*)
  // ============================================================
  @Get('categories')
  async getForumCategories(): Promise<ForumCategory[]> {
    return this.forumService.getForumCategories();
  }

  @Get('categories/tree')
  async getForumCategoryTree(): Promise<ForumCategory[]> {
    return this.forumService.getForumCategoryTree();
  }

  @Get('categories/slug/:slug')
  async getForumCategory(
    @Param('slug') slug: string,
  ): Promise<ForumCategory | null> {
    return this.forumService.getForumCategory(slug);
  }

  @Post('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async createForumCategory(
    @Body() body: CreateForumCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumCategory> {
    return this.forumService.createForumCategory(body, user.id);
  }

  @Put('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updateForumCategory(
    @Param('id') id: string,
    @Body() body: UpdateForumCategoryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumCategory> {
    return this.forumService.updateForumCategory(id, body, user.id);
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteForumCategory(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.deleteForumCategory(id, user.id);
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
    return this.forumService.getForumPosts(filters, user?.id);
  }

  @Get('posts/hot')
  @UseGuards(OptionalAuthGuard)
  async getHotPosts(
    @Query() query?: LimitQueryDto | string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumPost[]> {
    let limit = 8;
    if (typeof query === 'string') {
      limit = parseInt(query, 10) || 8;
    } else if (query?.limit !== undefined) {
      limit = Number(query.limit) || 8;
    }
    return this.forumService.getHotPosts(limit, user?.id);
  }

  @Get('posts/slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumPost(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumPost | null> {
    return this.forumService.getForumPost(slug, user?.id);
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  async createForumPost(
    @Body() body: CreateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.forumService.createForumPost(body, 'discussion', user.id);
  }

  @Post('questions')
  @UseGuards(AuthGuard)
  async createQuestionPost(
    @Body() body: CreateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.forumService.createForumPost(body, 'question', user.id);
  }

  @Put('posts/:id')
  @UseGuards(AuthGuard)
  async updateForumPost(
    @Param('id') id: string,
    @Body() body: UpdateForumPostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumPost> {
    return this.forumService.updateForumPost(id, body, user.id);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard)
  async deleteForumPost(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.deleteForumPost(id, user.id);
  }

  @Post('posts/:id/view')
  async incrementPostView(
    @Param('id') id: string,
  ): Promise<ForumActionResponse> {
    return this.forumService.incrementPostView(id);
  }

  @Post('posts/:id/like')
  @UseGuards(AuthGuard)
  async togglePostLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumLikeResponse> {
    return this.forumService.togglePostLike(id, user.id);
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
    return this.forumService.setPinned(id, pinned, user.id);
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
    return this.forumService.setRemoved('post', id, removed, user.id);
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
    return this.forumService.getForumComments(
      postId,
      {
        includeRemoved:
          query.includeRemoved === true ||
          (query.includeRemoved as unknown) === 'true',
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
    return this.forumService.createForumComment(
      postId,
      text,
      user.id,
      body.parentId,
    );
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard)
  async deleteForumComment(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.deleteForumComment(id, user.id);
  }

  @Post('comments/:id/like')
  @UseGuards(AuthGuard)
  async toggleCommentLike(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumLikeResponse> {
    return this.forumService.toggleCommentLike(id, user.id);
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
    return this.forumService.setRemoved('comment', id, removed, user.id);
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
    return this.forumService.getForumEvents(filters, user?.id);
  }

  @Get('events/slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumEvent(
    @Param('slug') slug: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ForumEvent | null> {
    return this.forumService.getForumEvent(slug, user?.id);
  }

  @Post('events')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async createForumEvent(
    @Body() body: CreateForumEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEvent> {
    return this.forumService.createForumEvent(body, user.id);
  }

  @Put('events/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async updateForumEvent(
    @Param('id') id: string,
    @Body() body: UpdateForumEventDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEvent> {
    return this.forumService.updateForumEvent(id, body, user.id);
  }

  @Delete('events/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async deleteForumEvent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.deleteForumEvent(id, user.id);
  }

  @Get('events/:id/attendees')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getEventAttendees(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumEventAttendee[]> {
    return this.forumService.getEventAttendees(id, user.id);
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
    return this.forumService.toggleEventRsvp(id, contactPhone, user.id);
  }

  // ============================================================
  // Stats (/forum/stats)
  // ============================================================
  @Get('stats')
  async getForumStats(): Promise<ForumStatsResponse> {
    return this.forumService.getForumStats();
  }
}
