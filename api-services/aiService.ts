import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const askLocalGuide = async (
    propertyName: string | null,
    location: string | null,
    userQuestion: string,
    history: { role: 'user' | 'model'; content: string }[] = []
): Promise<string> => {
    if (!apiKey) {
        return "AI Assistant is unavailable (Missing VITE_GEMINI_API_KEY). Please add your Gemini API key to .env.local";
    }

    try {
        // Format last 15 messages for context
        const recentHistory = history.slice(-15).map(msg =>
            `${msg.role === 'user' ? 'User' : 'Guide'}: ${msg.content}`
        ).join('\n');

        const contextPrompt = `
      You are a friendly, knowledgeable local travel guide in Alanya, Turkey.
      ${propertyName ? `The user is considering booking a property named "${propertyName}" located in "${location}".` : 'The user is planning a trip to Alanya.'}

      Conversation History:
      ${recentHistory}

      User Question: "${userQuestion}"
      
      Provide a helpful, concise answer (max 100 words). 
      If asked about services (health, transport, shopping), mention that Alanya Holidays offers verified direct bookings.
      Focus on distance, local tips, and atmosphere. Be enthusiastic about Alanya.
      IMPORTANT: Do not use markdown formatting (no bolding with asterisks, no headers). Use plain text only.
    `;

        // Strategy: Use models confirmed to exist in the user's account
        const modelsToTry = [
            "gemini-2.0-flash-001",           // Found in user's list
            "gemini-2.0-flash-lite-preview-02-05", // Lite version often has separate quota
            "gemini-flash-latest"             // Latest stable pointer
        ];

        let errors: string[] = [];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(contextPrompt);
                const response = await result.response;
                return response.text();
            } catch (error) {
                const errString = String(error);
                // If strictly rate limited (429), we might want to fail fast or inform user, 
                // but for now let's just try the next model which might have a different bucket.
                if (errString.includes("429")) {
                    console.warn(`Model ${modelName} rate limited.`);
                } else {
                    console.warn(`Model ${modelName} failed:`, error);
                }
                errors.push(`${modelName}: ${error instanceof Error ? error.message : errString}`);
            }
        }

        // Check if any error was a rate limit
        if (errors.some(e => e.includes("429"))) {
            return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
        }

        throw new Error(errors.join('\n'));

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Return a friendly message if it's likely a connection/model issue, but keep details for debugging if needed
        if (String(error).includes("429")) {
            return "I'm currently receiving too many requests. Please wait 10-20 seconds and try again! ⏳";
        }
        return `Error connecting to AI. Please check your internet or try again later.\n(Debug: ${error instanceof Error ? error.message : String(error)})`;
    }
};
