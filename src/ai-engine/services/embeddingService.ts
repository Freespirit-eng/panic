import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const embeddingService = {
  /**
   * Generates a dense embedding vector for the given text using
   * Google's text-embedding-004 model. Returns a float32 number[].
   */
  getEmbeddingVector: async (text: string): Promise<number[]> => {
    const result = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });

    const values = result.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error('[embeddingService] Empty embedding returned from Gemini');
    }

    return values;
  },
};
