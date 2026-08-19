import {
  Controller,
  Get,
  Post,
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
  CreateForumCommentDto,
  GetForumCommentsQueryDto,
} from '../dto/forum-comments.dto';
import { SetRemovedDto } from '../dto/forum-posts.dto';
import {
  AuthenticatedRequest,
  ForumActionResponse,
  ForumComment,
  ForumLikeResponse,
  OptionalAuthenticatedRequest,
} from '../types/forum.types';

@Controller('forum/comments')
export class ForumCommentsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Get('post/:postId')
  @UseGuards(OptionalAuthGuard)
  async getForumComments(
    @Param('postId') postId: string,
    @Query() query: GetForumCommentsQueryDto,
    @Req() req?: OptionalAuthenticatedRequest,
  ): Promise<ForumComment[]> {
    return this.forumPostsService.getForumComments(
      postId,
      {
        includeRemoved:
          query.includeRemoved === true ||
          (query.includeRemoved as unknown) === 'true',
      },
      req?.user?.id,
    );
  }

  @Post('post/:postId')
  @UseGuards(AuthGuard)
  async createForumComment(
    @Param('postId') postId: string,
    @Body() body: CreateForumCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumComment> {
    const text = body.body || body.content || '';
    return this.forumPostsService.createForumComment(postId, text, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumComment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumPostsService.deleteForumComment(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async toggleCommentLike(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumLikeResponse> {
    return this.forumPostsService.toggleCommentLike(id, req.user.id);
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
    return this.forumPostsService.setRemoved(
      'comment',
      id,
      removed,
      req.user.id,
    );
  }
}
