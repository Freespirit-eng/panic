import express from 'express';
import dotenv from 'dotenv';
import { initKnowledgeCache } from './services/ragService';
import aiEngineRoutes from './routes/aiEngine.routes';

dotenv.config();

const app = express();

// Parse JSON bodies — 20 MB limit for base64 image payloads
app.use(express.json({ limit: '20mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    service: 'PanicSense AI Engine',
    model: 'gemini-2.0-flash',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// AI Engine routes
// ---------------------------------------------------------------------------
app.use('/', aiEngineRoutes);

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
const PORT = Number(process.env.AI_ENGINE_PORT ?? 8001);

async function main() {
  try {
    // Warm up the embedding cache before accepting requests
    await initKnowledgeCache();
  } catch (err: any) {
    console.error('[AI Engine] Failed to initialise knowledge cache:', err.message);
    console.warn('[AI Engine] Continuing without pre-warmed cache — keyword fallback active.');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 PanicSense AI Engine running on port ${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/health`);
    console.log(`   Model        → gemini-2.0-flash + text-embedding-004\n`);
  });
}

main();
