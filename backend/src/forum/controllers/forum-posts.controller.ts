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

@Controller('forum/posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  async getForumPosts(@Query() query: any, @Req() req: any) {
    const filters = {
      categorySlug: query.categorySlug,
      sort: query.sort,
      limit: query.limit ? parseInt(query.limit) : 20,
      offset: query.offset ? parseInt(query.offset) : 0,
      includeRemoved: query.includeRemoved === 'true',
      removedOnly: query.removedOnly === 'true',
      postType: query.postType,
    };
    return this.forumPostsService.getForumPosts(filters, req.user?.id);
  }

  @Get('hot')
  @UseGuards(OptionalAuthGuard)
  async getHotPosts(@Query('limit') limit?: string, @Req() req?: any) {
    return this.forumPostsService.getHotPosts(
      limit ? parseInt(limit) : 8,
      req.user?.id,
    );
  }

  @Get('slug/:slug')
  @UseGuards(OptionalAuthGuard)
  async getForumPost(@Param('slug') slug: string, @Req() req: any) {
    return this.forumPostsService.getForumPost(slug, req.user?.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createForumPost(@Body() body: any, @Req() req: any) {
    return this.forumPostsService.createForumPost(
      body,
      'discussion',
      req.user.id,
    );
  }

  @Post('question')
  @UseGuards(AuthGuard)
  async createQuestionPost(@Body() body: any, @Req() req: any) {
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
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.forumPostsService.updateForumPost(id, body, req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteForumPost(@Param('id') id: string, @Req() req: any) {
    return this.forumPostsService.deleteForumPost(id, req.user.id);
  }

  @Post(':id/view')
  async incrementPostView(@Param('id') id: string) {
    return this.forumPostsService.incrementPostView(id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  async togglePostLike(@Param('id') id: string, @Req() req: any) {
    return this.forumPostsService.togglePostLike(id, req.user.id);
  }

  @Post(':id/pin')
  @UseGuards(AuthGuard)
  async setPinned(
    @Param('id') id: string,
    @Body('pinned') pinned: boolean,
    @Req() req: any,
  ) {
    return this.forumPostsService.setPinned(id, pinned, req.user.id);
  }

  @Post(':id/remove')
  @UseGuards(AuthGuard)
  async setRemoved(
    @Param('id') id: string,
    @Body('removed') removed: boolean,
    @Req() req: any,
  ) {
    return this.forumPostsService.setRemoved('post', id, removed, req.user.id);
  }
}
