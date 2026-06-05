import { Router } from 'express';
import { missionController } from '../controllers/missionController';

const router = Router();

router.get('/', missionController.getMissions);
router.post('/create', missionController.createMission);
router.post('/:id/action', missionController.performMissionAction);

export default router;
