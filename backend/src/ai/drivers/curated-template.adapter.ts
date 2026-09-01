import { Injectable } from '@nestjs/common';
import { AiGuideDriver } from './ai-guide-driver.interface';
import { AiGuideDto } from '../dto/ai-guide.dto';
import { GenerateItineraryDto } from '../dto/generate-itinerary.dto';
import {
  GeneratedDayPlan,
  GeneratedItineraryResponse,
  CURATED_ITINERARY_TEMPLATES,
} from '../types/ai-guide.types';

@Injectable()
export class CuratedTemplateAdapter implements AiGuideDriver {
  generateGuideAnswer(_dto: AiGuideDto): Promise<string> {
    return Promise.resolve(
      `Here are recommended highlights for your Alanya holiday:\n` +
        `• Alanya Castle (Alanya Kalesi): Medieval fortress with panoramic Mediterranean sunset views.\n` +
        `• Kleopatra Beach: Iconic golden sand beach in central Alanya.\n` +
        `• Damlatas Cave: Famous stalactite cave discovered in 1948.`,
    );
  }

  generateItineraryPlan(
    dto: GenerateItineraryDto,
  ): Promise<GeneratedItineraryResponse> {
    const rawDays = dto.days ?? dto.duration ?? 3;
    const daysCount = Math.max(1, Math.min(rawDays, 14));
    const district = dto.district || 'Alanya';
    const selectedDays: GeneratedDayPlan[] = [];

    for (let i = 0; i < daysCount; i++) {
      const template =
        CURATED_ITINERARY_TEMPLATES[i % CURATED_ITINERARY_TEMPLATES.length];
      const dayNum = i + 1;
      selectedDays.push({
        day: dayNum,
        dayLabel: `Day ${dayNum}`,
        title: template.title || `Day ${dayNum} Exploration`,
        theme: template.theme || template.title,
        items: template.items.map((item) => ({
          ...item,
          title: item.title || item.name,
          name: item.name || item.title,
        })),
      });
    }

    return Promise.resolve({
      title: `${daysCount}-Day Curated ${district} Itinerary`,
      description: `A handpicked ${daysCount}-day holiday plan exploring the scenic highlights, historic landmarks, and culinary treasures of ${district}, Turkey.`,
      district,
      days: selectedDays,
      itinerary: selectedDays,
    });
  }
}
