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
  })
};
