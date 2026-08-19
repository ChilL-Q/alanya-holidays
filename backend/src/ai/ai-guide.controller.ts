import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiGuideService } from './ai-guide.service';
import { AiGuideDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';

@Controller('ai')
export class AiGuideController {
  constructor(private readonly aiGuideService: AiGuideService) {}

  @Post('guide')
  @HttpCode(HttpStatus.OK)
  async askGuide(@Body() dto: AiGuideDto) {
    return this.aiGuideService.askGuide(dto);
  }

  @Post('itinerary')
  @HttpCode(HttpStatus.OK)
  async generateItinerary(@Body() dto: GenerateItineraryDto) {
    return this.aiGuideService.generateItinerary(dto);
  }
}
