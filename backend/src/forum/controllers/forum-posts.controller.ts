import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ForumPostsService } from '../services/forum-posts.service';
import { AuthGuard } from '../../auth/auth.guard';
import { OptionalAuthGuard } from '../../auth/optional-auth.guard';
import {
  CreateForumPostDto,
  GetForumPostsQueryDto,
  SetPinnedDto,
  SetRemovedDto,
  UpdateForumPostDto,
} from '../dto/forum-posts.dto';
import {
  AuthenticatedRequest,
  ForumActionResponse,
  ForumLikeResponse,
  ForumPaginatedResult,
  ForumPost,
  ForumPostsFilter,
  OptionalAuthenticatedRequest,
} from '../types/forum.types';

@Controller('forum/posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getForumPosts(
    @Query()
    query: GetForumPostsQueryDto,
    @Req() req: OptionalAuthenticatedRequest,
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
    return this.forumPostsService.getForumPosts(filters, req.user?.id);
  }

  @Get('hot')
  @UseGuards(OptionalAuthGuard)
  async getHotPosts(
    @Query('limit') limit?: string,
    @Req() req?: OptionalAuthenticatedRequest,
  ): Promise<ForumPost[]> {
    return this.forumPostsService.getHotPosts(
      limit ? parseInt(String(limit), 10) : 8,
      req?.user?.id,
    );
  }

  @Get('slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumPost(
    @Param('slug') slug: string,
    @Req() req: OptionalAuthenticatedRequest,
  ): Promise<ForumPost | null> {
    return this.forumPostsService.getForumPost(slug, req.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumPost(
    @Body() body: CreateForumPostDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumPost> {
    return this.forumPostsService.createForumPost(
      body,
      'discussion',
      req.user.id,
    );
  }

  @Post('question')
  @UseGuards(AuthGuard)
  async createQuestionPost(
    @Body() body: CreateForumPostDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumPost> {
    return this.forumPostsService.createForumPost(
      body,
      'question',
      req.user.id,
    );
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateForumPost(
    @Param('id') id: string,
    @Body() body: UpdateForumPostDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumPost> {
    return this.forumPostsService.updateForumPost(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumPost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumPostsService.deleteForumPost(id, req.user.id);
  }

  @Post(':id/view')
  async incrementPostView(
    @Param('id') id: string,
  ): Promise<ForumActionResponse> {
    return this.forumPostsService.incrementPostView(id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async togglePostLike(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumLikeResponse> {
    return this.forumPostsService.togglePostLike(id, req.user.id);
  }

  @Post(':id/pin')
  @UseGuards(AuthGuard)
  async setPinned(
    @Param('id') id: string,
    @Body() body: SetPinnedDto | { pinned: boolean } | boolean,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    const pinned =
      typeof body === 'object' && body !== null && 'pinned' in body
        ? Boolean(body.pinned)
        : Boolean(body);
    return this.forumPostsService.setPinned(id, pinned, req.user.id);
  }

  @Post(':id/remove')
  @UseGuards(AuthGuard)
  async setRemoved(
    @Param('id') id: string,
    @Body() body: SetRemovedDto | { removed: boolean } | boolean,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    const removed =
      typeof body === 'object' && body !== null && 'removed' in body
        ? Boolean(body.removed)
        : Boolean(body);
    return this.forumPostsService.setRemoved('post', id, removed, req.user.id);
  }
}
