import { Router } from 'express';
import { ragController } from '../controllers/rag.controller';

const router = Router();

router.post('/duplicate-check', ragController.handleDuplicateCheck);

export default router;
