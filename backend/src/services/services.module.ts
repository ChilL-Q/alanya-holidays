import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ServicesRepository } from './services.repository';

@Module({
  providers: [ServicesService, ServicesRepository],
  controllers: [ServicesController],
})
export class ServicesModule {}
