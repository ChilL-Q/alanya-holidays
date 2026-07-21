import { Injectable } from '@nestjs/common';
import { ForumStatsRepository } from '../repositories/forum-stats.repository';

@Injectable()
export class ForumStatsService {
  constructor(private readonly forumStatsRepository: ForumStatsRepository) {}

  async getForumStats() {
    return this.forumStatsRepository.getStats();
  }
}
