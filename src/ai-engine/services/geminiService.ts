import { Incident, ChatMessage } from '../../shared/types';

export const geminiService = {
  generateStructuredReport: async (description: string, imageBase64?: string): Promise<Partial<Incident>> => {
    // SKELETON: Gemini Prompt generation and parsing goes here
    throw new Error('Not implemented: AI Service Skeleton Only');
  },

  generateRagResponse: async (query: string, context: string[], history: ChatMessage[]): Promise<string> => {
    // SKELETON: Gemini Prompt structure with retrieval context goes here
    throw new Error('Not implemented: AI Service Skeleton Only');
  },

  makeDuplicateMergeDecision: async (newReport: Partial<Incident>, matchCandidates: Incident[]): Promise<'Merge' | 'Unique'> => {
    // SKELETON: Gemini comparison analysis logic goes here
    throw new Error('Not implemented: AI Service Skeleton Only');
  }
};
