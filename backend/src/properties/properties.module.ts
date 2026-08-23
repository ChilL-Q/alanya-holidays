import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertiesAdminController } from './properties-admin.controller';
import { PropertiesRepository } from './properties.repository';
import { SupabasePropertiesRepository } from './infrastructure/repositories/supabase-properties.repository';
import { PROPERTIES_REPOSITORY } from './domain';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PropertiesController, PropertiesAdminController],
  providers: [
    PropertiesService,
    SupabasePropertiesRepository,
    PropertiesRepository,
    {
      provide: PROPERTIES_REPOSITORY,
      useExisting: SupabasePropertiesRepository,
    },
  ],
  exports: [
    PropertiesService,
    PropertiesRepository,
    SupabasePropertiesRepository,
    PROPERTIES_REPOSITORY,
  ],
})
export class PropertiesModule {}
