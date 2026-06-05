import { Router } from 'express';
import { geofenceController } from '../controllers/geofence.controller';

const router = Router();

router.get('/', geofenceController.getGeofences);
router.post('/', geofenceController.createGeofence);

export default router;
