import { KnowledgeArticle, Incident } from '../../shared/types';

export const ragService = {
  searchKnowledgeBase: async (queryVector: number[], threshold: number): Promise<KnowledgeArticle[]> => {
    // SKELETON: Knowledge base vector query goes here
    throw new Error('Not implemented: AI Service Skeleton Only');
  },

  searchSimilarIncidents: async (incidentVector: number[], maxDistance: number): Promise<Incident[]> => {
    // SKELETON: Incident similarity vector search goes here
    throw new Error('Not implemented: AI Service Skeleton Only');
  }
};
