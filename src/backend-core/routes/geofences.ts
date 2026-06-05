import { Router } from 'express';
import { geofenceController } from '../controllers/geofenceController';

const router = Router();

router.get('/', geofenceController.getGeofences);
router.post('/', geofenceController.createGeofence);
router.delete('/:id', geofenceController.deleteGeofence);

export default router;
