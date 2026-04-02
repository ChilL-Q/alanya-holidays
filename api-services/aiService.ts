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
    history: { role: 'user' | 'model'; content: string }[] = []
): Promise<string> => {
    const invokeAiProxy = async () => {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                propertyName,
                location,
                userQuestion,
                history: history.slice(-15),
            },
        });

        if (error) {
            throw error;
        }

        if (data?.error) {
            const errorMsg = String(data.error);
            if (errorMsg.includes('429') || errorMsg.includes('rate')) {
                const rateLimitError = new Error("RATE_LIMIT");
                // @ts-ignore - adding custom property to error
                (rateLimitError as any).isRateLimit = true;
                throw rateLimitError;
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
    } catch (error: any) {
        console.error("AI Service Error after retries:", error);

        // Handle rate limits gracefully with a specific message
        if (error.isRateLimit || String(error).includes("429") || String(error).includes("rate")) {
            return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
        }

        // For other errors (network, 500s, etc.), return the curated fallback
        return getFallbackResponse();
    }
};
