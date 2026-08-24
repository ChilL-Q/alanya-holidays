import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { NOTIFICATIONS_REPOSITORY } from './domain/repositories/notifications.repository.interface';
import { SupabaseNotificationsRepository } from './infrastructure/repositories/supabase-notifications.repository';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useClass: SupabaseNotificationsRepository,
    },
  ],
  exports: [NotificationsService, NOTIFICATIONS_REPOSITORY],
})
export class NotificationsModule {}
