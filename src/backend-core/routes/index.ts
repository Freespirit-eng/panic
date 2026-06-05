import { Router } from 'express';
import authRoutes from './auth.routes';
import incidentRoutes from './incident.routes';
import volunteerRoutes from './volunteer.routes';
import missionRoutes from './mission.routes';
import broadcastRoutes from './broadcast.routes';
import geofenceRoutes from './geofence.routes';
import chatRoutes from './chat.routes';
import ragRoutes from './rag.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/incidents', incidentRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/missions', missionRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/geofences', geofenceRoutes);
router.use('/chat', chatRoutes);
router.use('/rag', ragRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
