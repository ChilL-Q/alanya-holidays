import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { RedisService } from '../common/redis/redis.service';
import { AiGuideDto, ChatMessageDto } from './dto/ai-guide.dto';
import { GenerateItineraryDto } from './dto/generate-itinerary.dto';

export { AiGuideDto, ChatMessageDto, GenerateItineraryDto };

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface ItineraryItem {
  time?: string;
  title?: string;
  name?: string;
  description: string;
  location?: string;
  timeSlot?: string;
  subcategory?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  link?: string;
}

export interface GeneratedDayPlan {
  day?: number;
  dayLabel?: string;
  title?: string;
  theme?: string;
  items: ItineraryItem[];
}

export interface GeneratedItineraryResponse {
  title: string;
  description: string;
  district?: string;
  days?: GeneratedDayPlan[];
  itinerary?: GeneratedDayPlan[];
  cached?: boolean;
}

export const ALANYA_GUIDE_SYSTEM_INSTRUCTION = `You are the official AI Holiday Guide and Local Concierge for "Alanya Holidays" (alanya-holidays.com), an expert on Alanya, Antalya, and the Turkish Riviera.

Your core mission and capabilities:
- Expert Knowledge: Provide accurate, enthusiastic, and practical recommendations for visitors, tourists, and residents in Alanya and its surrounding districts (Kleopatra, Damlatas, Mahmutlar, Oba, Tosmur, Kestel, Kargicak, Avsallar, Konakli, Okurcalar, Side, Gazipasa).
- Local Insights: Share expert tips on attractions (Alanya Castle / Kalesi, Damlatas Cave, Dim River / Dim Cayi, Red Tower / Kizil Kule, Sapadere Canyon, Cleopatra Beach, Teleferik cable car), beaches, authentic Turkish restaurants, seafood, cafes, nightlife, boat tours, outdoor activities, bazaars, shopping, and public transportation.
- Property & Location Context: If a specific property name or location is provided in the context, tailor distances, transit advice, and neighborhood recommendations relative to that spot.
- Multilingual Persona: Detect and reply in the user's language with native fluency, cultural nuance, and correct local terminology. Fully support Russian (RU), English (EN), and Turkish (TR).
- Tone & Format: Warm, welcoming, helpful, concise, and structured. Use markdown formatting (bullet points, bold highlights) for readable itineraries and guides.`;

export const CURATED_ITINERARY_TEMPLATES: GeneratedDayPlan[] = [
  {
    day: 1,
    dayLabel: 'Day 1',
    title: 'Historic Castle & Sunset Harbor',
    theme: 'Historic Castle & Sunset Harbor',
    items: [
      {
        time: '09:00',
        name: 'Cleopatra Beach & Damlataş Cave',
        title: 'Cleopatra Beach & Damlataş Cave',
        description:
          'Morning walk along Cleopatra Beach and explore the ancient Damlataş stalactite cave.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Kleopatra Beach',
        subcategory: 'Sightseeing & Nature',
        lat: 36.548,
        lng: 31.985,
        notes:
          'Damlataş Cave is cool inside (22°C year-round) right by the cable car station.',
      },
      {
        time: '13:00',
        name: 'Alanya Teleferik & Castle Citadel',
        title: 'Alanya Teleferik & Castle Citadel',
        description:
          'Scenic cable car ride up to Alanya Castle (Kalesi), exploring Byzantine churches and panoramas.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Alanya Castle',
        subcategory: 'Historical Landmark',
        lat: 36.5438,
        lng: 31.9998,
        notes: 'Wear comfortable shoes for walking on historic stone paths.',
      },
      {
        time: '18:00',
        name: 'Harbor Promenade & Red Tower (Kızıl Kule)',
        title: 'Harbor Promenade & Red Tower (Kızıl Kule)',
        description:
          'Walk along the ancient Seljuk harbor, admire the 13th-century octagonal Red Tower and shipyard.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Alanya Harbor',
        subcategory: 'Culture & Sightseeing',
        lat: 36.542,
        lng: 31.995,
        notes:
          'The sunset light illuminates the ancient stone walls magnificently.',
      },
    ],
  },
  {
    day: 2,
    dayLabel: 'Day 2',
    title: 'Mountain Escapes & Dim River',
    theme: 'Mountain Escapes & Dim River',
    items: [
      {
        time: '09:30',
        name: 'Dim Cave Exploration',
        title: 'Dim Cave Exploration',
        description:
          'Venture into the Taurus foothills to explore Dim Cave, one of Turkey’s largest stalactite caves.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Dim Cave',
        subcategory: 'Nature & Adventure',
        lat: 36.538,
        lng: 32.112,
        notes: 'Bring a light jacket as the interior remains cool all year.',
      },
      {
        time: '12:30',
        name: 'Floating Lunch & Swimming at Dim Çayı',
        title: 'Floating Lunch & Swimming at Dim Çayı',
        description:
          'Relax on floating wooden pergolas over the mountain river, enjoying grilled trout.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Dim River (Dim Cayi)',
        subcategory: 'Dining & Relaxation',
        lat: 36.47,
        lng: 32.15,
        notes: 'Water temperature is refreshing even during peak August heat.',
      },
      {
        time: '18:30',
        name: 'Oba Promenade & Local Bazaar',
        title: 'Oba Promenade & Local Bazaar',
        description:
          'Stroll through the pedestrian avenues of Oba, browsing spices, Turkish delight, and crafts.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Oba',
        subcategory: 'Shopping & Culture',
        lat: 36.535,
        lng: 32.03,
        notes: 'Great spot for authentic Turkish tea and evening atmosphere.',
      },
    ],
  },
  {
    day: 3,
    dayLabel: 'Day 3',
    title: 'Sapadere Canyon & East Coast',
    theme: 'Sapadere Canyon & East Coast',
    items: [
      {
        time: '09:00',
        name: 'Sapadere Canyon Walkway & Waterfalls',
        title: 'Sapadere Canyon Walkway & Waterfalls',
        description:
          'Suspended wooden walkway through a 360m mountain gorge with emerald pools and waterfalls.',
        timeSlot: 'Morning (8AM - 12PM)',
        location: 'Sapadere Canyon',
        subcategory: 'Adventure & Hiking',
        lat: 36.4,
        lng: 32.2,
        notes: 'Dare to swim in the icy mountain waterfall pools.',
      },
      {
        time: '13:00',
        name: 'Traditional Village Lunch in Sapadere',
        title: 'Traditional Village Lunch in Sapadere',
        description:
          'Homemade gözleme flatbread, local village honey, and mountain herb tea in a rustic garden.',
        timeSlot: 'Afternoon (12PM - 5PM)',
        location: 'Sapadere Village',
        subcategory: 'Authentic Dining',
        lat: 36.405,
        lng: 32.205,
        notes:
          'Visit the traditional silk weaving demonstration in the village.',
      },
      {
        time: '18:00',
        name: 'Mahmutlar Coastal Beach Sunset',
        title: 'Mahmutlar Coastal Beach Sunset',
        description:
          'Relax at a beachfront lounge in Mahmutlar with panoramic sunset views over Alanya Castle.',
        timeSlot: 'Evening (5PM - 9PM)',
        location: 'Mahmutlar Beach',
        subcategory: 'Beach & Relaxation',
        lat: 36.49,
        lng: 32.09,
        notes: 'Spectacular wide open view of the castle peninsula.',
      },
    ],
  },
];

@Injectable()
export class AiGuideService {
  private readonly logger = new Logger(AiGuideService.name);

  constructor(private readonly redisService: RedisService) {}

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
    const days = dto.days || dto.duration || 3;
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

    // 2. Fetch completion from Gemini or fallback
    const answer = await this.fetchFromGeminiOrFallback(dto);

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

    // 2. Fetch from Gemini or Curated Fallback
    const result = await this.fetchItineraryFromGeminiOrFallback(dto);

    // 3. Store in Redis Cache with 24-hour TTL
    await this.redisService.set(cacheKey, JSON.stringify(result), 86400);

    return { ...result, cached: false };
  }

  private async fetchFromGeminiOrFallback(dto: AiGuideDto): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.getCuratedFallback(dto);
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
        return this.getCuratedFallback(dto);
      }

      const json = (await res.json()) as GeminiResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to invoke Gemini API: ${message}`);
    }

    return this.getCuratedFallback(dto);
  }

  private async fetchItineraryFromGeminiOrFallback(
    dto: GenerateItineraryDto,
  ): Promise<GeneratedItineraryResponse> {
    const daysCount = Math.max(1, Math.min(dto.days || dto.duration || 3, 14));
    const district = dto.district || 'Alanya';
    const interests = (
      dto.interests || ['Sightseeing', 'Beaches', 'Culture', 'Dining']
    ).join(', ');
    const pace = dto.pace || 'moderate';
    const budget = dto.budget || 'standard';
    const companion = dto.companion || 'travelers';

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return this.getCuratedItineraryFallback(dto);
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
        return this.getCuratedItineraryFallback(dto);
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

    return this.getCuratedItineraryFallback(dto);
  }

  private parseItineraryJson(raw: string): GeneratedItineraryResponse | null {
    try {
      let clean = raw.trim();
      if (clean.startsWith('```')) {
        clean = clean
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();
      }
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1);
      }
      const parsed = JSON.parse(clean) as GeneratedItineraryResponse;
      return parsed;
    } catch {
      return null;
    }
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
    const daysCount = Math.max(1, Math.min(dto.days || dto.duration || 3, 14));
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
