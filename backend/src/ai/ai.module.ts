import { Module } from '@nestjs/common';
import { AiGuideController } from './ai-guide.controller';
import { AiGuideService } from './ai-guide.service';
import { RedisModule } from '../common/redis/redis.module';
import { AI_GUIDE_DRIVER } from './drivers/ai-guide-driver.interface';
import { GeminiGuideAdapter } from './drivers/gemini-guide.adapter';
import { CuratedTemplateAdapter } from './drivers/curated-template.adapter';

@Module({
  imports: [RedisModule],
  controllers: [AiGuideController],
  providers: [
    CuratedTemplateAdapter,
    GeminiGuideAdapter,
    {
      provide: AI_GUIDE_DRIVER,
      useClass: GeminiGuideAdapter,
    },
    AiGuideService,
  ],
  exports: [
    AiGuideService,
    AI_GUIDE_DRIVER,
    GeminiGuideAdapter,
    CuratedTemplateAdapter,
  ],
})
export class AiModule {}
