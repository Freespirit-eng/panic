import { Router } from 'express';
import { missionController } from '../controllers/mission.controller';

const router = Router();

router.get('/', missionController.getMissions);
router.get('/:id', missionController.getMissionById);
router.post('/', missionController.createMission);
router.patch('/:id', missionController.updateMission);

export default router;
