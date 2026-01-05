import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export const askLocalGuide = async (propertyName: string | null, location: string | null, userQuestion: string): Promise<string> => {
  if (!apiKey) {
    return "AI Assistant is unavailable (Missing API Key). However, I can tell you that Alanya is wonderful this time of year!";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly, knowledgeable local travel guide in Alanya, Turkey. 
      ${propertyName ? `The user is considering booking a property named "${propertyName}" located in "${location}".` : 'The user is planning a trip to Alanya.'}
      
      User Question: "${userQuestion}"
      
      Provide a helpful, concise answer (max 100 words). 
      If asked about services (health, transport, shopping), mention that Alanya Holidays offers verified direct bookings.
      Focus on distance, local tips, and atmosphere. Be enthusiastic about Alanya.`,
    });

    return response.text || "I couldn't find an answer for that right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble reaching the local guide service at the moment.";
  }
};