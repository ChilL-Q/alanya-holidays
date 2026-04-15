import { supabase } from './supabase';
import { retry } from '../utils/retry';

/**
 * Curated fallback recommendations for Alanya travel.
 * Used when the AI service is unavailable.
 */
const FALLBACK_RECOMMENDATIONS = [
    {
        name: "Alanya Castle (Alanya Kalesi)",
        description: "A medieval castle with stunning panoramic views of the city and the Mediterranean Sea. Don't miss the sunset from the top!"
    },
    {
        name: "Kleopatra Beach",
        description: "One of the most famous beaches in Turkey, known for its golden sand and crystal-clear waters. Legend says Queen Cleopatra herself swam here."
    },
    {
        name: "Damlatas Cave",
        description: "A fascinating cave discovered in 1948, famous for its impressive stalactites, stalagmites, and air that is beneficial for respiratory health."
    },
    {
        name: "Red Tower (Kızıl Kule)",
        description: "The iconic symbol of Alanya, this 13th-century octagonal tower houses the Ethnographic Museum and offers great views of the harbor."
    },
    {
        name: "Dim Cave & Dim River",
        description: "Escape the heat at Dim River, where you can dine on floating platforms, and explore the nearby Dim Cave, one of the largest in Turkey."
    },
    {
        name: "Alanya Harbor",
        description: "A vibrant area perfect for evening strolls, boat trips, and enjoying local seafood at the many waterfront restaurants."
    },
    {
        name: "Sapadere Canyon",
        description: "A natural wonder with wooden walkways through the canyon, leading to beautiful waterfalls and refreshing swimming spots."
    }
];

/**
 * Formats the fallback recommendations into a user-friendly string.
 * @returns A formatted string containing travel recommendations.
 */
const getFallbackResponse = (): string => {
    const intro = "I'm having trouble connecting to my AI brain right now, but here are some top recommendations for your Alanya holiday:\n\n";
    const recommendations = FALLBACK_RECOMMENDATIONS.map(rec => `• **${rec.name}**: ${rec.description}`).join('\n\n');
    return intro + recommendations;
};

/**
 * Custom error class for AI service rate limits.
 */
class RateLimitError extends Error {
    isRateLimit = true;
    constructor(message: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

/**
 * Asks the AI Local Guide a question about a property or Alanya in general.
 * Includes retry logic and fallback recommendations if the service is unavailable.
 * 
 * @param propertyName - Name of the property (optional)
 * @param location - Location of the property (optional)
 * @param userQuestion - The question from the user
 * @param history - Chat history for context
 * @returns The AI's response or a fallback message
 */
export const askLocalGuide = async (
    propertyName: string | null,
    location: string | null,
    userQuestion: string,
    history: { role: 'user' | 'model'; content: string }[] = [],
    mode: 'chat' | 'structured' = 'chat'
): Promise<string> => {
    const invokeAiProxy = async () => {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                propertyName,
                location,
                userQuestion,
                history: history.slice(-15),
                mode,
            },
        });

        if (error) {
            throw error;
        }

        if (data?.error) {
            const errorMsg = String(data.error);
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
                throw new RateLimitError("RATE_LIMIT");
            }
            throw new Error(errorMsg);
        }

        if (!data?.answer) {
            throw new Error("No answer generated");
        }

        return data.answer;
    };

    try {
        return await retry(invokeAiProxy, { 
            attempts: 3, 
            delay: 500, 
            factor: 2 
        });
    } catch (error: unknown) {
        console.error("AI Service Error after retries:", error);

        // Handle rate limits gracefully with a specific message
        if (error instanceof RateLimitError || (error as { isRateLimit?: boolean }).isRateLimit || String(error).includes("429") || String(error).includes("rate")) {
            return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
        }

        // For other errors (network, 500s, etc.), return the curated fallback
        return getFallbackResponse();
    }
};
export const planTrip = async (
    prefs: { 
        duration: number; 
        companion: string; 
        interests: string[];
        pace: string;
        budget: string;
    }
): Promise<string> => {
    const prompt = `Act as an expert Alanya tour guide. Generate a detailed ${prefs.duration}-day trip itinerary for a ${prefs.companion}.
    Interests: ${prefs.interests.join(', ')}.
    Pace: ${prefs.pace}.
    Budget Level: ${prefs.budget}.
    
    IMPORTANT GUIDELINES:
    - If budget is "economy": Suggest using "Dolmuş" (local buses) for transport. Recommend free public beaches (Damlataş, Kleopatra), local Pide/Lavaş restaurants, and hiking the Castle hills.
    - If budget is "standard": Suggest car/scooter rentals. Recommend a mix of local favorites and popular tourist spots like Dim Çayı or Sapadere Canyon.
    - If budget is "luxury": Suggest private VIP transfers or luxury car rentals. Recommend premium beach clubs (e.g., Illusia, Envie), private yacht tours from the harbor, and fine dining with castle views.
    - If pace is "relaxed": Focus on 1-2 key locations per day with plenty of "Beach time" or "Leisure at harbor".
    - If pace is "intense": Include 3-4 distinct stops per day (e.g., Morning: Castle & Red Tower; Afternoon: Dim Cave; Evening: Harbor & Nightlife).

    YOUR ENTIRE RESPONSE MUST BE A SINGLE JSON OBJECT. DO NOT USE MARKDOWN BLOCKS (\`\`\`json). DO NOT ADD PREAMBLE OR POSTAMBLE.
    
    Structure:
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Day Title",
          "items": [
            {"time": "09:00", "title": "Activity Name", "description": "Brief description", "location": "Area", "link": "/services/..."}
          ]
        }
      ]
    }
    
    Link suggestions:
    - /services/car-rental
    - /things-to-do-in-alanya
    - /medical-tourism-alanya
    - /alanya-real-estate
    - /alanya-hotels`;

    return askLocalGuide(null, "Alanya", prompt, [], 'structured');
};
