import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumReportService } from './application/forum-report.service';
import { ModerationAuditService } from '../admin/moderation-audit.service';
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
  constructor(
    private readonly discussionService: ForumDiscussionService,
    private readonly reportService: ForumReportService,
    @Optional()
    private readonly moderationAuditService?: ModerationAuditService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async reportContent(
    @Body() body: CreateForumReportDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    return this.reportService.reportContent(body, user.id);
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
    return this.reportService.getForumReports(
      {
        includeResolved,
        page: query.page !== undefined ? Number(query.page) : undefined,
        limit: query.limit !== undefined ? Number(query.limit) : undefined,
        target_type: query.target_type,
      },
      user.id,
    );
  }

  @Post(':id/resolve')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async resolveForumReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumActionResponse> {
    const result = await this.reportService.resolveForumReport(id, user.id);
    if (this.moderationAuditService) {
      await this.moderationAuditService.logAction({
        entity_type: 'forum_report',
        entity_id: id,
        action: 'resolve',
        admin_id: user.id,
      });
    }
    return result;
  }

  @Get('removed-comments')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole('admin')
  async getRemovedComments(
    @Query() query: GetRemovedCommentsQueryDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ForumComment[]> {
    const limit = query.limit ? Number(query.limit) : 50;
    return this.discussionService.getRemovedComments(limit, user.id);
  }
}
