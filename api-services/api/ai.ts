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
 * Uses Claude API via the generate-itinerary Edge Function.
 *
 * @param prefs - User preferences (days, interests, budget, language)
 * @returns A JSON string containing the generated itinerary
 * @throws Error if the itinerary generation fails
 */
export const generateItinerary = async (prefs: ItineraryPrefs): Promise<string> => {
  const invokeItineraryFunction = async () => {
    // Map new interface to Edge Function parameters
    // For now, we use sensible defaults for 'companion' and 'pace'
    const { data, error } = await supabase.functions.invoke('generate-itinerary', {
      body: {
        duration: prefs.days,
        companion: 'individual traveler',
        interests: prefs.interests,
        pace: 'balanced',
        budget: mapBudgetLevel(prefs.budget),
      },
    });

    if (error) {
      throw error;
    }

    if (data?.error) {
      const errorMsg = String(data.error);
      if (errorMsg.includes('429') || errorMsg.includes('rate')) {
        throw new RateLimitError('Rate limit exceeded');
      }
      if (errorMsg.includes('upgrade_required')) {
        throw new Error('UPGRADE_REQUIRED');
      }
      throw new Error(errorMsg);
    }

    if (!data?.answer) {
      throw new Error('No itinerary generated');
    }

    return data.answer;
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
