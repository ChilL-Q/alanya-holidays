import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AiGuideService } from './ai-guide.service';
import { AiGuideDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';

@Controller('ai')
export class AiGuideController {
  constructor(private readonly aiGuideService: AiGuideService) {}

  /**
   * Идентичность для rate limit: аутентифицированный user id, иначе IP.
   */
  private identity(req?: Request): string {
    const userId = (req as (Request & { user?: { id?: string } }) | undefined)
      ?.user?.id;
    return userId ?? req?.ip ?? 'anonymous';
  }

  @Post('guide')
  @HttpCode(HttpStatus.OK)
  async askGuide(@Body() dto: AiGuideDto, @Req() req: Request) {
    return this.aiGuideService.askGuide(dto, this.identity(req));
  }

  @Post('itinerary')
  @HttpCode(HttpStatus.OK)
  async generateItinerary(
    @Body() dto: GenerateItineraryDto,
    @Req() req: Request,
  ) {
    return this.aiGuideService.generateItinerary(dto, this.identity(req));
  }
}
