import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

router.post('/citizen', chatController.handleCitizenChat);
router.post('/responder', chatController.handleResponderChat);

export default router;
