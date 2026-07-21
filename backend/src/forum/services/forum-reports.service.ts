import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ForumReportsRepository } from '../repositories/forum-reports.repository';

@Injectable()
export class ForumReportsService {
  constructor(private readonly forumReportsRepository: ForumReportsRepository) {}

  private async requireAdmin(userId: string) {
    const role = await this.forumReportsRepository.getUserRole(userId);
    if (role !== 'admin')
      throw new UnauthorizedException('Not authorized');
  }

  async reportContent(input: any, userId: string) {
    await this.forumReportsRepository.insertReport({
      target_type: input.target_type,
      target_id: input.target_id,
      reporter_id: userId,
      reason: input.reason,
    });
    return { success: true };
  }

  async getForumReports(includeResolved: boolean, userId: string) {
    await this.requireAdmin(userId);
    return this.forumReportsRepository.getReports(includeResolved);
  }

  async resolveForumReport(id: string, userId: string) {
    await this.requireAdmin(userId);
    await this.forumReportsRepository.updateReportResolved(id);
    return { success: true };
  }
}
