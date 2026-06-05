import { Router } from 'express';
import { broadcastController } from '../controllers/broadcast.controller';

const router = Router();

// NOTE: /queue must be before any /:id routes
router.get('/queue', broadcastController.getQueueStatus);
router.get('/', broadcastController.getBroadcasts);
router.post('/', broadcastController.createBroadcast);

export default router;
