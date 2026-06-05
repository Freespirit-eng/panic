import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/summary', analyticsController.getSummary);
router.get('/export', analyticsController.export);

export default router;
