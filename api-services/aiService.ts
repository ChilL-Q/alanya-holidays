import { supabase } from './supabase';

export const askLocalGuide = async (
    propertyName: string | null,
    location: string | null,
    userQuestion: string,
    history: { role: 'user' | 'model'; content: string }[] = []
): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('ai-proxy', {
            body: {
                propertyName,
                location,
                userQuestion,
                history: history.slice(-15),
            },
        });

        if (error) {
            console.error('AI Proxy Error:', error);

            // Check if it's a function not found / network error
            if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                return "Error connecting to AI. Please check your internet or try again later.";
            }

            return `AI Assistant is temporarily unavailable. Please try again later.`;
        }

        if (data?.answer) {
            return data.answer;
        }

        if (data?.error) {
            console.error('AI Proxy returned error:', data.error);
            if (data.error.includes('429') || data.error.includes('rate')) {
                return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
            }
            return "AI Assistant is temporarily unavailable. Please try again later.";
        }

        return "I couldn't generate a response. Please try again.";

    } catch (error) {
        console.error("AI Service Error:", error);
        if (String(error).includes("429")) {
            return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
        }
        return `Error connecting to AI. Please check your internet or try again later.`;
    }
};
