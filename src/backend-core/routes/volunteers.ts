import { Router } from 'express';
import { volunteerController } from '../controllers/volunteerController';

const router = Router();

router.get('/', volunteerController.getVolunteers);
router.post('/', volunteerController.registerVolunteer);
router.post('/:id/alert/:alertId/accept', volunteerController.acceptAlert);

export default router;
