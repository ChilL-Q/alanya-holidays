import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertiesRepository } from './properties.repository';

@Module({
  providers: [PropertiesService, PropertiesRepository],
  controllers: [PropertiesController],
})
export class PropertiesModule {}
