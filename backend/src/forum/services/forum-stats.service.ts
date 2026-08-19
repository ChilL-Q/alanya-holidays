import { Injectable } from '@nestjs/common';
import { ForumStatsRepository } from '../repositories/forum-stats.repository';
import { ForumStatsResponse } from '../types/forum.types';

@Injectable()
export class ForumStatsService {
  constructor(private readonly forumStatsRepository: ForumStatsRepository) {}

  async getForumStats(): Promise<ForumStatsResponse> {
    return this.forumStatsRepository.getStats();
  }
}
