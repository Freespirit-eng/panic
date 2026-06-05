import { Request, Response, NextFunction } from 'express';

export const incidentController = {
  getIncidents: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // SKELETON: Express handler
      res.json({ success: true, incidents: [] });
    } catch (err) {
      next(err);
    }
  },

  createIncidentReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // SKELETON: Express handler
      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  verifyIncident: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // SKELETON: Express handler
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
