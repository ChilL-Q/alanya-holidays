import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiGuideService, AiGuideDto } from './ai-guide.service';

@Controller('ai')
export class AiGuideController {
  constructor(private readonly aiGuideService: AiGuideService) {}

  @Post('guide')
  @HttpCode(HttpStatus.OK)
  async askGuide(@Body() dto: AiGuideDto) {
    return this.aiGuideService.askGuide(dto);
  }
}
