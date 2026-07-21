import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ForumReportsService } from '../services/forum-reports.service';
import { ForumPostsService } from '../services/forum-posts.service';
import { AuthGuard } from '../../auth/auth.guard';

@Controller('forum/reports')
export class ForumReportsController {
  constructor(
    private readonly forumReportsService: ForumReportsService,
    private readonly forumPostsService: ForumPostsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async reportContent(@Body() body: any, @Req() req: any) {
    return this.forumReportsService.reportContent(body, req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getForumReports(
    @Query('includeResolved') includeResolved: string,
    @Req() req: any,
  ) {
    return this.forumReportsService.getForumReports(
      includeResolved === 'true',
      req.user.id,
    );
  }

  @Post(':id/resolve')
  @UseGuards(AuthGuard)
  async resolveForumReport(@Param('id') id: string, @Req() req: any) {
    return this.forumReportsService.resolveForumReport(id, req.user.id);
  }

  @Get('removed-comments')
  @UseGuards(AuthGuard)
  async getRemovedComments(@Query('limit') limit: string, @Req() req: any) {
    return this.forumPostsService.getRemovedComments(
      limit ? parseInt(limit) : 50,
      req.user.id,
    );
  }
}
