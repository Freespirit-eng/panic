import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { asyncHandler } from '../middleware/error.middleware';
import { duplicateCheckSchema } from '../validators';

export const ragController = {
  handleDuplicateCheck: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = duplicateCheckSchema.parse(req.body);
    const result = await aiService.checkDuplicate(
      validatedData.description,
      validatedData.latitude,
      validatedData.longitude
    );
    res.status(200).json({ success: true, ...result });
  }),

  handleAnalyzeImage: asyncHandler(async (req: Request, res: Response) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ success: false, error: 'Missing required field: imageBase64' });
      return;
    }
    const result = await aiService.analyzeImage(imageBase64);
    res.status(200).json({ success: true, ...result });
  })
};
