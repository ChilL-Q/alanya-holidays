import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EnquiriesController } from './enquiries.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationAuditRepository } from './moderation-audit.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AdminController, EnquiriesController],
  providers: [
    AdminService,
    AdminRepository,
    ModerationAuditService,
    ModerationAuditRepository,
  ],
  exports: [
    AdminService,
    AdminRepository,
    ModerationAuditService,
    ModerationAuditRepository,
  ],
})
export class AdminModule {}
