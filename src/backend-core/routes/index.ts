import { Router } from 'express';
import incidentRoutes from './incidents';
import volunteerRoutes from './volunteers';
import missionRoutes from './missions';
import broadcastRoutes from './broadcasts';
import geofenceRoutes from './geofences';
import chatRoutes from './chat';
import ragRoutes from './rag';

const router = Router();

router.use('/incidents', incidentRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/missions', missionRoutes);
router.use('/broadcasts', broadcastRoutes);
router.use('/geofences', geofenceRoutes);
router.use('/chat', chatRoutes);
router.use('/rag', ragRoutes);

export default router;
