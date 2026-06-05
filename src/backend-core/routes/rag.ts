import { Router } from 'express';
import { ragController } from '../controllers/ragController';

const router = Router();

router.get('/', ragController.queryKnowledgeArticles);

export default router;
