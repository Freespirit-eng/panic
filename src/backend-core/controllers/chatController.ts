import { Request, Response, NextFunction } from 'express';

export const chatController = {
  handleChatMessage: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, reply: {} });
    } catch (err) {
      next(err);
    }
  }
};
