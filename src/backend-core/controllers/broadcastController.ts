import { Request, Response, NextFunction } from 'express';

export const broadcastController = {
  getBroadcasts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, broadcasts: [] });
    } catch (err) {
      next(err);
    }
  },

  createBroadcast: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
