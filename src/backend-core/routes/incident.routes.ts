import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { uploadSingleImage } from '../middleware/upload.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// IMPORTANT: /stats must come before /:id to avoid Express treating "stats" as an :id param
router.get('/stats', authenticate, incidentController.getStats);
router.get('/live-query', authenticate, incidentController.liveQuery);

router.get('/', authenticate, incidentController.getIncidents);
router.get('/:id', authenticate, incidentController.getIncidentById);
router.post('/', uploadSingleImage('image'), incidentController.createIncident); // Publicly accessible to report
router.patch('/:id', authenticate, incidentController.updateIncident);
router.patch('/:id/verify', authenticate, incidentController.verifyIncident);
router.delete('/:id', authenticate, incidentController.deleteIncident);
router.post('/:id/merge', authenticate, incidentController.mergeIncident);

export default router;
