import { Router } from 'express';
import { chatController } from '../controllers/chatController';

const router = Router();

router.post('/', chatController.handleChatMessage);

export default router;
