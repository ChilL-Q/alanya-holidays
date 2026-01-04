import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export const askLocalGuide = async (propertyName: string, location: string, userQuestion: string): Promise<string> => {
  if (!apiKey) {
    return "AI Assistant is unavailable (Missing API Key). However, I can tell you that Alanya is wonderful this time of year!";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly, knowledgeable local travel guide in Alanya, Turkey. 
      The user is considering booking a property named "${propertyName}" located in "${location}".
      
      User Question: "${userQuestion}"
      
      Provide a helpful, concise answer (max 100 words). Focus on distance, local tips, and atmosphere. 
      If asked about distances, estimate based on the location. Be enthusiastic about Alanya.`,
    });

    return response.text || "I couldn't find an answer for that right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble reaching the local guide service at the moment.";
  }
};