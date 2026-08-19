import { Controller, Get } from '@nestjs/common';
import { ForumStatsService } from '../services/forum-stats.service';
import { ForumStatsResponse } from '../types/forum.types';

@Controller('forum/stats')
export class ForumStatsController {
  constructor(private readonly forumStatsService: ForumStatsService) {}

  @Get()
  async getForumStats(): Promise<ForumStatsResponse> {
    return this.forumStatsService.getForumStats();
  }
}
