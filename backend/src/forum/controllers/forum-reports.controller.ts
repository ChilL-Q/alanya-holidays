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
import {
  CreateForumReportDto,
  GetForumReportsQueryDto,
} from '../dto/forum-reports.dto';
import { GetRemovedCommentsQueryDto } from '../dto/forum-comments.dto';
import {
  AuthenticatedRequest,
  ForumActionResponse,
  ForumComment,
  ForumReport,
} from '../types/forum.types';

@Controller('forum/reports')
export class ForumReportsController {
  constructor(
    private readonly forumReportsService: ForumReportsService,
    private readonly forumPostsService: ForumPostsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async reportContent(
    @Body() body: CreateForumReportDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumReportsService.reportContent(body, req.user.id);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getForumReports(
    @Query() query: GetForumReportsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumReport[]> {
    const includeResolved =
      query.includeResolved === true ||
      (query.includeResolved as unknown) === 'true';
    return this.forumReportsService.getForumReports(
      includeResolved,
      req.user.id,
    );
  }

  @Post(':id/resolve')
  @UseGuards(AuthGuard)
  async resolveForumReport(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumActionResponse> {
    return this.forumReportsService.resolveForumReport(id, req.user.id);
  }

  @Get('removed-comments')
  @UseGuards(AuthGuard)
  async getRemovedComments(
    @Query() query: GetRemovedCommentsQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ForumComment[]> {
    const limit = query.limit ? Number(query.limit) : 50;
    return this.forumPostsService.getRemovedComments(limit, req.user.id);
  }
}
