import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/types/auth-user.interface';
import {
  CreateForumReportDto,
  GetForumReportsQueryDto,
} from './dto/forum-reports.dto';
import { GetRemovedCommentsQueryDto } from './dto/forum-comments.dto';
import {
  ForumActionResponse,
  ForumComment,
  ForumReport,
} from './types/forum.types';

@Controller('forum/reports')
export class ForumModerationController {
  constructor(private readonly forumService: ForumService) {}

  @Post()
  @UseGuards(AuthGuard)
  async reportContent(
    @Body() body: CreateForumReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.reportContent(body, user.id);
  }

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getForumReports(
    @Query() query: GetForumReportsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumReport[]> {
    const includeResolved =
      query.includeResolved === true ||
      (query.includeResolved as unknown) === 'true';
    return this.forumService.getForumReports(includeResolved, user.id);
  }

  @Post(':id/resolve')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async resolveForumReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.forumService.resolveForumReport(id, user.id);
  }

  @Get('removed-comments')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getRemovedComments(
    @Query() query: GetRemovedCommentsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumComment[]> {
    const limit = query.limit ? Number(query.limit) : 50;
    return this.forumService.getRemovedComments(limit, user.id);
  }
}
