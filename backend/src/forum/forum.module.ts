import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { ForumCategoriesController } from './controllers/forum-categories.controller';
import { ForumPostsController } from './controllers/forum-posts.controller';
import { ForumCommentsController } from './controllers/forum-comments.controller';
import { ForumEventsController } from './controllers/forum-events.controller';
import { ForumReportsController } from './controllers/forum-reports.controller';
import { ForumStatsController } from './controllers/forum-stats.controller';

import { ForumCategoriesService } from './services/forum-categories.service';
import { ForumCategoriesRepository } from './repositories/forum-categories.repository';
import { ForumPostsService } from './services/forum-posts.service';
import { ForumPostsRepository } from './repositories/forum-posts.repository';
import { ForumEventsService } from './services/forum-events.service';
import { ForumEventsRepository } from './repositories/forum-events.repository';
import { ForumReportsService } from './services/forum-reports.service';
import { ForumReportsRepository } from './repositories/forum-reports.repository';
import { ForumStatsService } from './services/forum-stats.service';
import { ForumStatsRepository } from './repositories/forum-stats.repository';

@Module({
  imports: [SupabaseModule],
  controllers: [
    ForumCategoriesController,
    ForumPostsController,
    ForumCommentsController,
    ForumEventsController,
    ForumReportsController,
    ForumStatsController,
  ],
  providers: [
    ForumCategoriesService,
    ForumCategoriesRepository,
    ForumPostsService,
    ForumPostsRepository,
    ForumEventsService,
    ForumEventsRepository,
    ForumReportsService,
    ForumReportsRepository,
    ForumStatsService,
    ForumStatsRepository,
  ],
  exports: [
    ForumCategoriesService,
    ForumPostsService,
    ForumEventsService,
    ForumReportsService,
    ForumStatsService,
  ],
})
export class ForumModule {}
