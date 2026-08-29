import { KnowledgeArticle, Incident } from '../../shared/types';
import { embeddingService } from './embeddingService';
import { knowledgeBase } from '../data/knowledgeBase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cosine similarity between two equal-length vectors. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Haversine distance in kilometres between two lat/lng points.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// In-memory knowledge cache
// ---------------------------------------------------------------------------

interface CachedDoc {
  doc: KnowledgeArticle;
  vector: number[];
}

let knowledgeCache: CachedDoc[] = [];
let cacheReady = false;

/**
 * Pre-computes embeddings for all knowledge base articles at server startup.
 * Call this once before the server begins serving requests.
 */
export async function initKnowledgeCache(): Promise<void> {
  console.log('[RAG] Initialising knowledge base embedding cache...');
  const results: CachedDoc[] = [];

  for (const doc of knowledgeBase) {
    const text = `${doc.title}. ${doc.content}`;
    const vector = await embeddingService.getEmbeddingVector(text);
    results.push({ doc, vector });
    console.log(`[RAG]  ✓ Embedded: ${doc.id} — ${doc.title}`);
  }

  knowledgeCache = results;
  cacheReady = true;
  console.log(`[RAG] Knowledge cache ready — ${knowledgeCache.length} articles embedded.`);
}

// ---------------------------------------------------------------------------
// RAG Service
// ---------------------------------------------------------------------------

export const ragService = {
  /**
   * Embeds the query and returns the top-N knowledge articles whose cosine
   * similarity exceeds `threshold`. Falls back to a tag-keyword match if the
   * cache is not yet warm (e.g., called before initKnowledgeCache).
   */
  searchKnowledgeBase: async (
    query: string,
    threshold = 0.65,
    topN = 3,
  ): Promise<KnowledgeArticle[]> => {
    if (!cacheReady || knowledgeCache.length === 0) {
      // Fallback: basic keyword search on tags
      console.warn('[RAG] Cache not ready — using keyword fallback for knowledge search.');
      const lower = query.toLowerCase();
      return knowledgeBase
        .filter((doc) => doc.tags.some((tag) => lower.includes(tag)))
        .slice(0, topN);
    }

    const queryVector = await embeddingService.getEmbeddingVector(query);

    const scored = knowledgeCache.map(({ doc, vector }) => ({
      doc,
      score: cosineSimilarity(queryVector, vector),
    }));

    return scored
      .filter(({ score }) => score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(({ doc }) => doc);
  },

  /**
   * Finds existing incidents that are semantically similar to `description`
   * AND within `radiusKm` of the provided coordinates.
   * Returns an array of { incident, similarity } pairs sorted by similarity.
   */
  searchSimilarIncidents: async (
    description: string,
    lat: number,
    lng: number,
    radiusKm = 5,
    similarityThreshold = 0.80,
  ): Promise<{ incident: Incident; similarity: number }[]> => {
    // Fetch all incidents from the backend API
    let incidents: Incident[] = [];
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/api/incidents`);
      if (res.ok) {
        const json = await res.json();
        incidents = Array.isArray(json.data) ? json.data : [];
      }
    } catch (err: any) {
      console.warn('[RAG] Could not reach backend incidents API:', err.message);
      return [];
    }

    if (incidents.length === 0) return [];

    // Embed the incoming description
    const descVector = await embeddingService.getEmbeddingVector(description);

    const results: { incident: Incident; similarity: number }[] = [];

    for (const incident of incidents) {
      // 1. Geospatial filter — must be within radiusKm
      const distKm = haversineKm(
        lat,
        lng,
        incident.location.lat,
        incident.location.lng,
      );
      if (distKm > radiusKm) continue;

      // 2. Semantic similarity — embed the incident's recommendedAction as a
      //    representative text fingerprint
      const incidentText = `${incident.type}: ${incident.recommendedAction}`;
      const incidentVector = await embeddingService.getEmbeddingVector(incidentText);
      const similarity = cosineSimilarity(descVector, incidentVector);

      if (similarity >= similarityThreshold) {
        results.push({ incident, similarity });
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity);
  },
};
