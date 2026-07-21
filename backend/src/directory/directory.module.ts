import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller';
import { DirectoryService } from './directory.service';
import { DirectoryRepository } from './directory.repository';

@Module({
  controllers: [DirectoryController],
  providers: [DirectoryService, DirectoryRepository],
})
export class DirectoryModule {}
