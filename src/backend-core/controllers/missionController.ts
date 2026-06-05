import { Request, Response, NextFunction } from 'express';

export const missionController = {
  getMissions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, missions: [] });
    } catch (err) {
      next(err);
    }
  },

  createMission: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  performMissionAction: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
