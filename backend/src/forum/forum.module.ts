import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ForumController } from './forum.controller';
import { ForumModerationController } from './forum-moderation.controller';
import { ForumService } from './forum.service';
import { ForumDiscussionService } from './application/forum-discussion.service';
import { ForumEventService } from './application/forum-event.service';
import { ForumReportService } from './application/forum-report.service';
import { ForumRepository } from './forum.repository';
import { UserRolesRepository } from '../common/auth/user-roles.repository';

@Module({
  imports: [SupabaseModule, AuthModule, UsersModule],
  controllers: [ForumController, ForumModerationController],
  providers: [
    ForumRepository,
    UserRolesRepository,
    ForumDiscussionService,
    ForumEventService,
    ForumReportService,
    ForumService,
  ],
  exports: [
    ForumRepository,
    ForumDiscussionService,
    ForumEventService,
    ForumReportService,
    ForumService,
  ],
})
export class ForumModule {}
