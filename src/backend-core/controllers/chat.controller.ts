import { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { asyncHandler } from '../middleware/error.middleware';
import { citizenChatSchema, responderChatSchema } from '../validators';

export const chatController = {
  handleCitizenChat: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = citizenChatSchema.parse(req.body);
    const reply = await aiService.getCitizenChatResponse(validatedData.message);
    res.status(200).json({ success: true, data: reply });
  }),

  handleResponderChat: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = responderChatSchema.parse(req.body);
    const reply = await aiService.getResponderChatResponse(validatedData.incidentId, validatedData.message);
    res.status(200).json({ success: true, data: reply });
  })
};
