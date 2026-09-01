import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesAdminController } from './services-admin.controller';
import { ServicesRepository } from './services.repository';
import { SupabaseServicesRepository } from './infrastructure/repositories/supabase-services.repository';
import { SERVICES_REPOSITORY } from './domain';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ServicesController, ServicesAdminController],
  providers: [
    ServicesService,
    SupabaseServicesRepository,
    ServicesRepository,
    {
      provide: SERVICES_REPOSITORY,
      useExisting: SupabaseServicesRepository,
    },
  ],
  exports: [
    ServicesService,
    ServicesRepository,
    SupabaseServicesRepository,
    SERVICES_REPOSITORY,
  ],
})
export class ServicesModule {}
