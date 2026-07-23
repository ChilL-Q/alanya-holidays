import { Module } from '@nestjs/common';
import { AiGuideController } from './ai-guide.controller';
import { AiGuideService } from './ai-guide.service';

@Module({
  controllers: [AiGuideController],
  providers: [AiGuideService],
  exports: [AiGuideService],
})
export class AiModule {}
