import { Router } from 'express';
import { volunteerController } from '../controllers/volunteer.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, volunteerController.getVolunteers);
router.get('/:id', authenticate, volunteerController.getVolunteerById);
router.post('/', volunteerController.registerVolunteer);
router.patch('/:id', authenticate, volunteerController.updateVolunteer);
router.patch('/:id/alerts/:alertId/accept', authenticate, volunteerController.acceptAlert);
router.post('/:id/assign', authenticate, volunteerController.assignIncident);

export default router;
