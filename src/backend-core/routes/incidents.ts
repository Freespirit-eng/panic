import { Router } from 'express';
import { incidentController } from '../controllers/incidentController';

const router = Router();

router.get('/', incidentController.getIncidents);
router.post('/', incidentController.createIncidentReport);
router.post('/:id/verify', incidentController.verifyIncident);

export default router;
