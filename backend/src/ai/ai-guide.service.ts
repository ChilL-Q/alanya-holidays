import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../common/redis/redis.service';

export interface AiGuideDto {
  propertyName?: string | null;
  location?: string | null;
  userQuestion: string;
  history?: { role: 'user' | 'model'; content: string }[];
  mode?: 'chat' | 'structured';
}

@Injectable()
export class AiGuideService {
  private readonly logger = new Logger(AiGuideService.name);

  constructor(private readonly redisService: RedisService) {}

  private computeHash(dto: AiGuideDto): string {
    const raw = `${dto.propertyName || ''}:${dto.location || ''}:${dto.mode || 'chat'}:${dto.userQuestion}`;
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

    // 2. Fetch completion from Gemini or Generate Itinerary
    const answer = await this.fetchFromGeminiOrFallback(dto);

    // 3. Store in Redis Cache with 24-hour TTL
    await this.redisService.set(cacheKey, answer, 86400);

    return { answer, cached: false };
  }

  private async fetchFromGeminiOrFallback(dto: AiGuideDto): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.getCuratedFallback(dto);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const promptText = `Location: ${dto.location || 'Alanya'}. Property: ${dto.propertyName || 'N/A'}.\nQuestion: ${dto.userQuestion}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      });

      if (!res.ok) {
        this.logger.warn(`Gemini API HTTP error ${res.status}`);
        return this.getCuratedFallback(dto);
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: any) {
      this.logger.error(`Failed to invoke Gemini API: ${e.message}`);
    }

    return this.getCuratedFallback(dto);
  }

  private getCuratedFallback(_dto: AiGuideDto): string {
    return (
      `Here are recommended highlights for your Alanya holiday:\n` +
      `• Alanya Castle (Alanya Kalesi): Medieval fortress with panoramic Mediterranean sunset views.\n` +
      `• Kleopatra Beach: Iconic golden sand beach in central Alanya.\n` +
      `• Damlatas Cave: Famous stalactite cave discovered in 1948.`
    );
  }
}
