import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesRepository } from './services.repository';
import { SupabaseServicesRepository } from './infrastructure/repositories/supabase-services.repository';
import { SERVICES_REPOSITORY } from './domain';

@Module({
  controllers: [ServicesController],
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
