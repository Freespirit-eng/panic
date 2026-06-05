import { Router } from 'express';
import { volunteerController } from '../controllers/volunteer.controller';

const router = Router();

router.get('/', volunteerController.getVolunteers);
router.get('/:id', volunteerController.getVolunteerById);
router.post('/', volunteerController.registerVolunteer);
router.patch('/:id', volunteerController.updateVolunteer);
router.patch('/:id/alerts/:alertId/accept', volunteerController.acceptAlert);
router.post('/:id/assign', volunteerController.assignIncident);

export default router;
