import { Injectable, Logger } from '@nestjs/common';
import { AiGuideDriver } from './ai-guide-driver.interface';
import { CuratedTemplateAdapter } from './curated-template.adapter';
import { AiGuideDto } from '../dto/ai-guide.dto';
import { GenerateItineraryDto } from '../dto/generate-itinerary.dto';
import {
  ALANYA_GUIDE_SYSTEM_INSTRUCTION,
  GeminiResponse,
  GeneratedDayPlan,
  GeneratedItineraryResponse,
} from '../types/ai-guide.types';

@Injectable()
export class GeminiGuideAdapter implements AiGuideDriver {
  private readonly logger = new Logger(GeminiGuideAdapter.name);

  constructor(
    private readonly fallbackAdapter: CuratedTemplateAdapter = new CuratedTemplateAdapter(),
  ) {}

  async generateGuideAnswer(dto: AiGuideDto): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.fallbackAdapter.generateGuideAnswer(dto);
    }

    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string }>;
      }> = [];

      if (dto.history && dto.history.length > 0) {
        for (const turn of dto.history) {
          contents.push({
            role: turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: turn.content }],
          });
        }
      }

      const promptText =
        dto.propertyName || dto.location
          ? `Location: ${dto.location || 'Alanya'}. Property: ${dto.propertyName || 'N/A'}.\nQuestion: ${dto.userQuestion}`
          : `Location: Alanya. Property: N/A.\nQuestion: ${dto.userQuestion}`;

      contents.push({
        role: 'user',
        parts: [{ text: promptText }],
      });

      const body = {
        system_instruction: {
          parts: [{ text: ALANYA_GUIDE_SYSTEM_INSTRUCTION }],
        },
        contents,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        this.logger.warn(`Gemini API HTTP error ${res.status}`);
        return this.fallbackAdapter.generateGuideAnswer(dto);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to invoke Gemini API: ${message}`);
    }

    return this.fallbackAdapter.generateGuideAnswer(dto);
  }

  async generateItineraryPlan(
    dto: GenerateItineraryDto,
  ): Promise<GeneratedItineraryResponse> {
    const rawDays = dto.days ?? dto.duration ?? 3;
    const daysCount = Math.max(1, Math.min(rawDays, 14));
    const district = dto.district || 'Alanya';
    const interests = (
      dto.interests || ['Sightseeing', 'Beaches', 'Culture', 'Dining']
    ).join(', ');
    const pace = dto.pace || 'moderate';
    const budget = dto.budget || 'standard';
    const companion = dto.companion || 'travelers';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.fallbackAdapter.generateItineraryPlan(dto);
    }

    try {
      const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const prompt = `You are the expert local trip planner for Alanya Holidays (alanya-holidays.com).
Generate a realistic and exciting ${daysCount}-day holiday itinerary for ${district}, Turkey.
Companion: ${companion}. Interests: ${interests}. Pace: ${pace}. Budget: ${budget}.

Respond ONLY with a valid JSON object matching this schema without preamble or markdown code blocks:
{
  "title": "Inspiring Title for this ${daysCount}-Day ${district} Holiday",
  "description": "2-3 sentences overview describing this vacation itinerary.",
  "district": "${district}",
  "days": [
    {
      "day": 1,
      "dayLabel": "Day 1",
      "title": "Historic Castle & Harbor Highlights",
      "theme": "Historic Castle & Harbor Highlights",
      "items": [
        {
          "time": "09:00",
          "name": "Cleopatra Beach & Damlataş Cave",
          "title": "Cleopatra Beach & Damlataş Cave",
          "description": "Explore the iconic beach and ancient stalactite cave.",
          "timeSlot": "Morning (8AM - 12PM)",
          "location": "Kleopatra Beach",
          "subcategory": "Sightseeing",
          "notes": "Insider tip or recommendation",
          "lat": 36.548,
          "lng": 31.985
        }
      ]
    }
  ]
}`;

      const body = {
        system_instruction: {
          parts: [{ text: ALANYA_GUIDE_SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        this.logger.warn(`Gemini API HTTP error ${res.status} for itinerary`);
        return this.fallbackAdapter.generateItineraryPlan(dto);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = this.parseItineraryJson(text);
        if (
          parsed &&
          ((parsed.days && parsed.days.length > 0) ||
            (parsed.itinerary && parsed.itinerary.length > 0))
        ) {
          const daysList = parsed.days || parsed.itinerary || [];
          return {
            title: parsed.title || `${daysCount}-Day ${district} Adventure`,
            description:
              parsed.description ||
              `A curated ${daysCount}-day itinerary exploring the best of ${district}.`,
            district,
            days: daysList.slice(0, daysCount),
            itinerary: daysList.slice(0, daysCount),
          };
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to generate itinerary with Gemini: ${message}`);
    }

    return this.fallbackAdapter.generateItineraryPlan(dto);
  }

  private isGeneratedDayPlanArray(value: unknown): value is GeneratedDayPlan[] {
    return Array.isArray(value);
  }

  private parseItineraryJson(raw: string): GeneratedItineraryResponse | null {
    try {
      let clean = raw.trim();
      // Remove any markdown code block wrapper markers
      clean = clean
        .replace(/```(?:json)?/gi, '')
        .replace(/```/g, '')
        .trim();

      const firstBrace = clean.indexOf('{');
      const firstBracket = clean.indexOf('[');

      // If response is a direct array of days [ { ... } ]
      if (
        firstBracket !== -1 &&
        (firstBrace === -1 || firstBracket < firstBrace)
      ) {
        const lastBracket = clean.lastIndexOf(']');
        if (lastBracket !== -1 && lastBracket > firstBracket) {
          const arrayStr = clean.slice(firstBracket, lastBracket + 1);
          const parsedArray: unknown = JSON.parse(arrayStr);
          if (this.isGeneratedDayPlanArray(parsedArray)) {
            return {
              title: 'Curated Itinerary',
              description: 'AI-generated personalized holiday plan',
              days: parsedArray,
              itinerary: parsedArray,
            };
          }
        }
      }

      if (firstBrace !== -1) {
        const lastBrace = clean.lastIndexOf('}');
        if (lastBrace !== -1 && lastBrace > firstBrace) {
          const objStr = clean.slice(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(objStr) as GeneratedItineraryResponse;
          return parsed;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
