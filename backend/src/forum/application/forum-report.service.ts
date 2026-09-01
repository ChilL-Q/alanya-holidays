import { Injectable, Optional } from '@nestjs/common';
import { ForumRepository } from '../forum.repository';
import { UserRolesRepository } from '../../common/auth/user-roles.repository';
import { assertAdmin } from '../domain/forum-authorization.helper';
import { CreateForumReportDto } from '../dto/forum-reports.dto';
import { ForumActionResponse, ForumReport } from '../types/forum.types';

@Injectable()
export class ForumReportService {
  constructor(
    private readonly forumRepository: ForumRepository,
    @Optional() private readonly userRolesRepo?: UserRolesRepository,
  ) {}

  private async requireAdmin(userId: string): Promise<void> {
    const role = await this.userRolesRepo?.getRole(userId);
    assertAdmin(role);
  }

  // ============================================================
  // Reports
  // ============================================================
  async reportContent(
    input: CreateForumReportDto,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.forumRepository.insertReport({
      target_type: input.target_type,
      target_id: input.target_id,
      reporter_id: userId,
      reason: input.reason,
    });
    return { success: true };
  }

  async getForumReports(
    options:
      | {
          includeResolved?: boolean;
          page?: number;
          limit?: number;
          target_type?: 'post' | 'comment';
        }
      | boolean,
    userId: string,
  ): Promise<ForumReport[]> {
    await this.requireAdmin(userId);
    return this.forumRepository.getReports(options);
  }

  async resolveForumReport(
    id: string,
    userId: string,
  ): Promise<ForumActionResponse> {
    await this.requireAdmin(userId);
    await this.forumRepository.updateReportResolved(id);
    return { success: true };
  }
}
