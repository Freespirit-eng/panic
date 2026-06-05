import { Request, Response, NextFunction } from 'express';

export const volunteerController = {
  getVolunteers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, volunteers: [] });
    } catch (err) {
      next(err);
    }
  },

  registerVolunteer: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  acceptAlert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
