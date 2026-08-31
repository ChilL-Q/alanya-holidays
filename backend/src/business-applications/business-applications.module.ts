import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { BusinessApplicationsController } from './business-applications.controller';
import { BusinessApplicationsRepository } from './business-applications.repository';
import { BusinessApplicationsService } from './business-applications.service';

@Module({
  imports: [AuthModule, SupabaseModule],
  controllers: [BusinessApplicationsController],
  providers: [BusinessApplicationsService, BusinessApplicationsRepository],
  exports: [BusinessApplicationsService],
})
export class BusinessApplicationsModule {}
