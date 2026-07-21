import { Controller, Get } from '@nestjs/common';
import { ForumStatsService } from '../services/forum-stats.service';

@Controller('forum/stats')
export class ForumStatsController {
  constructor(private readonly forumStatsService: ForumStatsService) {}

  @Get()
  async getForumStats() {
    return this.forumStatsService.getForumStats();
  }
}
