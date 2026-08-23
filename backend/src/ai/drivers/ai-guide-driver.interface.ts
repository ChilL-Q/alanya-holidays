import { AiGuideDto } from '../dto/ai-guide.dto';
import { GenerateItineraryDto } from '../dto/generate-itinerary.dto';
import { GeneratedItineraryResponse } from '../types/ai-guide.types';

export const AI_GUIDE_DRIVER = Symbol('AI_GUIDE_DRIVER');

export interface AiGuideDriver {
  generateGuideAnswer(dto: AiGuideDto): Promise<string>;
  generateItineraryPlan(
    dto: GenerateItineraryDto,
  ): Promise<GeneratedItineraryResponse>;
}
