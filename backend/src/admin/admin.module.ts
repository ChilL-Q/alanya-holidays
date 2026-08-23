import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { EnquiriesController } from './enquiries.controller';
import { AdminService } from './admin.service';
import { AdminRepository } from './admin.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SupabaseModule, AuthModule],
  controllers: [AdminController, EnquiriesController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService, AdminRepository],
})
export class AdminModule {}
