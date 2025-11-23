import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to generate a book cover BACKGROUND image (no text)
export const generateCoverImage = async (title: string, theme: string): Promise<string | null> => {
  try {
    // We explicitly ask for NO TEXT so we can overlay our own clean typography
    const prompt = `Aesthetic abstract wall art poster for a travel album named "${title}". 
    Style: ${theme}, minimalist, vector flat design, or matte painting. 
    High contrast, vibrant but few colors. 
    IMPORTANT: NO TEXT, NO LETTERS, NO WORDS in the image. Just art/scenery/patterns.
    Vertical aspect ratio.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;

  } catch (error) {
    console.error("Error generating cover:", error);
    throw error;
  }
};

// Helper to refine text anecdotes
export const refineText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following photo album anecdote to be more nostalgic, poetic, and aesthetic, keeping it under 50 words: "${text}"`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Error refining text:", error);
    return text;
  }
};