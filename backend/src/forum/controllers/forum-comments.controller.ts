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

@Controller('forum/comments')
export class ForumCommentsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Get('post/:postId')
  async getForumComments(
    @Param('postId') postId: string,
    @Query('includeRemoved') includeRemoved?: string,
    @Req() req?: any,
  ) {
    return this.forumPostsService.getForumComments(
      postId,
      { includeRemoved: includeRemoved === 'true' },
      req.user?.id,
    );
  }

  @Post('post/:postId')
  @UseGuards(AuthGuard)
  async createForumComment(
    @Param('postId') postId: string,
    @Body('body') body: string,
    @Req() req: any,
  ) {
    return this.forumPostsService.createForumComment(postId, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumComment(@Param('id') id: string, @Req() req: any) {
    return this.forumPostsService.deleteForumComment(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async toggleCommentLike(@Param('id') id: string, @Req() req: any) {
    return this.forumPostsService.toggleCommentLike(id, req.user.id);
  }

  @Post(':id/remove')
  @UseGuards(AuthGuard)
  async setRemoved(
    @Param('id') id: string,
    @Body('removed') removed: boolean,
    @Req() req: any,
  ) {
    return this.forumPostsService.setRemoved(
      'comment',
      id,
      removed,
      req.user.id,
    );
  }
}
