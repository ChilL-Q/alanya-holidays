import { Injectable, Inject, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../common/redis/redis.service';
import { AiGuideDto, ChatMessageDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';
import {
  AI_GUIDE_DRIVER,
  AiGuideDriver,
} from './drivers/ai-guide-driver.interface';
import {
  ItineraryItem,
  GeneratedDayPlan,
  GeneratedItineraryResponse,
  ALANYA_GUIDE_SYSTEM_INSTRUCTION,
  CURATED_ITINERARY_TEMPLATES,
} from './types/ai-guide.types';

export {
  AiGuideDto,
  ChatMessageDto,
  GenerateItineraryDto,
  ALANYA_GUIDE_SYSTEM_INSTRUCTION,
  CURATED_ITINERARY_TEMPLATES,
};

export type { ItineraryItem, GeneratedDayPlan, GeneratedItineraryResponse };

@Injectable()
export class AiGuideService {
  private readonly logger = new Logger(AiGuideService.name);

  constructor(
    private readonly redisService: RedisService,
    @Inject(AI_GUIDE_DRIVER)
    private readonly guideDriver: AiGuideDriver,
  ) {}

  private computeHash(dto: AiGuideDto): string {
    const historyPart =
      dto.history && dto.history.length > 0
        ? JSON.stringify(
            dto.history.map((h) => ({
              role: h.role,
              content: (h.content || '').trim(),
            })),
          )
        : '';

    const raw = `${dto.propertyName || ''}:${dto.location || ''}:${dto.mode || 'chat'}:${(dto.userQuestion || '').trim()}:${historyPart}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private computeItineraryHash(dto: GenerateItineraryDto): string {
    const days = dto.days ?? dto.duration ?? 3;
    const district = dto.district || 'Alanya';
    const interests = (dto.interests || []).slice().sort().join(',');
    const pace = dto.pace || 'moderate';
    const budget = dto.budget || 'standard';
    const companion = dto.companion || '';
    const language = dto.language || 'en';

    const raw = `${days}:${district}:${interests}:${pace}:${budget}:${companion}:${language}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async askGuide(
    dto: AiGuideDto,
  ): Promise<{ answer: string; cached: boolean }> {
    const hash = this.computeHash(dto);
    const cacheKey = `ai_guide:${hash}`;

    // 1. Check Redis Cache
    const cachedAnswer = await this.redisService.get(cacheKey);
    if (cachedAnswer) {
      this.logger.log(`Cache hit for AI Guide key: ${hash.substring(0, 8)}`);
      return { answer: cachedAnswer, cached: true };
    }

    // 2. Fetch completion from injected guide driver
    const answer = await this.guideDriver.generateGuideAnswer(dto);

    // 3. Store in Redis Cache with 24-hour TTL
    await this.redisService.set(cacheKey, answer, 86400);

    return { answer, cached: false };
  }

  async generateItinerary(
    dto: GenerateItineraryDto,
  ): Promise<GeneratedItineraryResponse> {
    const hash = this.computeItineraryHash(dto);
    const cacheKey = `ai_itinerary:${hash}`;

    // 1. Check Redis Cache
    const cachedRaw = await this.redisService.get(cacheKey);
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw) as GeneratedItineraryResponse;
        this.logger.log(
          `Cache hit for AI Itinerary key: ${hash.substring(0, 8)}`,
        );
        return { ...parsed, cached: true };
      } catch {
        // invalid JSON cache, proceed to regenerate
      }
    }

    // 2. Fetch from injected guide driver
    const result = await this.guideDriver.generateItineraryPlan(dto);

    // 3. Store in Redis Cache with 24-hour TTL
    await this.redisService.set(cacheKey, JSON.stringify(result), 86400);

    return { ...result, cached: false };
  }

  getCuratedFallback(_dto: AiGuideDto): string {
    return (
      `Here are recommended highlights for your Alanya holiday:\n` +
      `• Alanya Castle (Alanya Kalesi): Medieval fortress with panoramic Mediterranean sunset views.\n` +
      `• Kleopatra Beach: Iconic golden sand beach in central Alanya.\n` +
      `• Damlatas Cave: Famous stalactite cave discovered in 1948.`
    );
  }

  getCuratedItineraryFallback(
    dto: GenerateItineraryDto,
  ): GeneratedItineraryResponse {
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

    return {
      title: `${daysCount}-Day Curated ${district} Itinerary`,
      description: `A handpicked ${daysCount}-day holiday plan exploring the scenic highlights, historic landmarks, and culinary treasures of ${district}, Turkey.`,
      district,
      days: selectedDays,
      itinerary: selectedDays,
    };
  }
}
