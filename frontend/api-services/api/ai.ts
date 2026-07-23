import { supabase } from '../supabase';
import { retry } from '../../utils/retry';

/**
 * Itinerary preferences for AI-powered trip planning
 */
export interface ItineraryPrefs {
  days: number;
  interests: string[];
  budget: 'budget' | 'mid' | 'luxury';
  language: 'en' | 'tr' | 'ru' | 'ar';
}

/**
 * Custom error class for rate limit errors
 */
class RateLimitError extends Error {
  isRateLimit = true;
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Fallback message when AI service is unavailable
 */
const getFallbackMessage = (): string => {
  return "I'm having trouble generating your itinerary right now. Please try again in a few moments or contact support if the issue persists.";
};

/**
 * Generates an AI-powered itinerary for a trip to Alanya based on user preferences.
 * Uses Claude API via the generate-itinerary Edge Function with streaming.
 *
 * @param prefs - User preferences (days, interests, budget, language)
 * @param onChunk - Optional callback to handle streaming chunks as they arrive
 * @returns A JSON string containing the generated itinerary
 * @throws Error if the itinerary generation fails
 */
export const generateItinerary = async (
  prefs: ItineraryPrefs,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  const invokeItineraryFunction = async () => {
    const invokePromise = supabase.functions.invoke('generate-itinerary', {
      body: {
        duration: prefs.days,
        companion: 'individual traveler',
        interests: prefs.interests,
        pace: 'balanced',
        budget: mapBudgetLevel(prefs.budget),
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 15000)
    );

    const response = await Promise.race([invokePromise, timeoutPromise]);

    // Check for top-level errors
    if (response.error) {
      throw response.error;
    }

    // Handle streaming response (ReadableStream)
    if (response.data instanceof ReadableStream) {
      return await parseStreamingResponse(response.data, onChunk);
    }

    // Fallback for non-streaming response (backward compatibility)
    if (response.data?.error) {
      const errorMsg = String(response.data.error);
      if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        throw new RateLimitError('Rate limit exceeded');
      }
      if (errorMsg.includes('upgrade_required')) {
        throw new Error('UPGRADE_REQUIRED');
      }
      throw new Error(errorMsg);
    }

    if (!response.data?.answer) {
      throw new Error('No itinerary generated');
    }

    return response.data.answer;
  };

  try {
    return await retry(invokeItineraryFunction, {
      attempts: 3,
      delay: 500,
      factor: 2,
    });
  } catch (error: unknown) {
    console.error('Itinerary generation failed:', error);

    // Handle rate limits with specific message
    if (error instanceof RateLimitError || (error as { isRateLimit?: boolean }).isRateLimit) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Preserve upgrade_required error for UI to handle
    if (String(error).includes('UPGRADE_REQUIRED')) {
      throw new Error('UPGRADE_REQUIRED');
    }

    // For other errors, throw the original error or fallback
    throw new Error(getFallbackMessage());
  }
};

/**
 * Parses a streaming response from the generate-itinerary Edge Function.
 * Reads newline-delimited JSON chunks and aggregates the complete response.
 *
 * @param stream - The ReadableStream from the Edge Function
 * @param onChunk - Optional callback to handle each chunk as it arrives
 * @returns The complete itinerary response as a string
 */
async function parseStreamingResponse(
  stream: ReadableStream,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    // Read stream chunks and parse newline-delimited JSON
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.chunk) {
            fullText += parsed.chunk;
            onChunk?.(parsed.chunk);
          } else if (parsed.done) {
            // Stream completed
            break;
          }
        } catch (e) {
          console.error('Failed to parse stream chunk:', line, e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!fullText) {
    throw new Error('Empty response from streaming');
  }

  return fullText;
}

/**
 * Maps the new budget terminology to the Edge Function's expected values
 * 'budget' => 'economy', 'mid' => 'standard', 'luxury' => 'luxury'
 */
function mapBudgetLevel(budget: 'budget' | 'mid' | 'luxury'): string {
  const budgetMap = {
    budget: 'economy',
    mid: 'standard',
    luxury: 'luxury',
  };
  return budgetMap[budget];
}
