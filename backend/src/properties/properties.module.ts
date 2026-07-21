import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  providers: [PropertiesService],
  controllers: [PropertiesController]
})
export class PropertiesModule {}
