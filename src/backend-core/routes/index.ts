import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import authRoutes      from './auth.routes';
import incidentRoutes  from './incident.routes';
import volunteerRoutes from './volunteer.routes';
import missionRoutes   from './mission.routes';
import broadcastRoutes from './broadcast.routes';
import geofenceRoutes  from './geofence.routes';
import chatRoutes      from './chat.routes';
import ragRoutes       from './rag.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

/**
 * Auth strategy: GET (reads) are public for the EOC dashboard.
 * POST / PATCH / DELETE (writes) are protected per-route with authenticate + requireRole.
 * This avoids requiring a login flow in the command center frontend for read-only views.
 */

// ─── Fully public ─────────────────────────────────────────────────────────────
router.use('/auth',       authRoutes);
router.use('/chat',       chatRoutes);
router.use('/rag',        ragRoutes);

// ─── Read-public, write-protected per route ───────────────────────────────────
router.use('/incidents',  incidentRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/missions',   missionRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/geofences',  geofenceRoutes);
router.use('/analytics',  analyticsRoutes);

export default router;

// ─── RBAC helpers (imported by individual route files when needed) ─────────────
export { authenticate, requireRole };
