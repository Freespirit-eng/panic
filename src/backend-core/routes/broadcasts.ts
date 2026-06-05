import { Router } from 'express';
import { broadcastController } from '../controllers/broadcastController';

const router = Router();

router.get('/', broadcastController.getBroadcasts);
router.post('/', broadcastController.createBroadcast);

export default router;
