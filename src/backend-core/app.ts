import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index';
import { errorMiddleware, AppError } from './middleware/error.middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Global Middleware ---
// CORS Headers — Allow M1 (Citizen Portal) and M3 (Command Center) Vite origins
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Health Check ---
app.get('/api/health', async (req: Request, res: Response) => {
  let aiStatus = 'OFFLINE';
  try {
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8001';
    const aiRes = await fetch(`${aiEngineUrl}/health`);
    if (aiRes.ok) {
      aiStatus = 'ONLINE';
    }
  } catch (err) {
    // Ignore error, AI status remains OFFLINE
  }

  res.status(200).json({
    status: 'OK',
    service: 'PanicSense Backend Core',
    aiStatus,
    timestamp: new Date().toISOString()
  });
});

// --- Primary API Router ---
app.use('/api', router);

// --- Serve Vite Production Build (Static Frontend) ---
// Vite outputs built assets to dist/ at the project root.
// After esbuild bundles server.ts into dist/server.js, the client assets
// are siblings in the same dist/ folder or in dist/assets/.
const clientDistPath = __dirname;
app.use(express.static(clientDistPath, { index: false }));

// --- SPA Fallback: Serve index.html for all non-API routes ---
// This enables client-side routing (React Router) to work on page refresh.
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // Don't serve index.html for API routes — let them fall through to 404
  if (req.originalUrl.startsWith('/api')) {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
    return;
  }

  const indexPath = path.resolve(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
    }
  });
});

// --- Centralized Error Middleware ---
app.use(errorMiddleware);

export default app;

