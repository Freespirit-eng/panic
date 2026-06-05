import { Router } from 'express';
import { incidentController } from '../controllers/incident.controller';
import { uploadSingleImage } from '../middleware/upload.middleware';

const router = Router();

// IMPORTANT: /stats must come before /:id to avoid Express treating "stats" as an :id param
router.get('/stats', incidentController.getStats);

router.get('/', incidentController.getIncidents);
router.get('/:id', incidentController.getIncidentById);
router.post('/', uploadSingleImage('image'), incidentController.createIncident);
router.patch('/:id', incidentController.updateIncident);
router.patch('/:id/verify', incidentController.verifyIncident);
router.delete('/:id', incidentController.deleteIncident);
router.post('/:id/merge', incidentController.mergeIncident);

export default router;
