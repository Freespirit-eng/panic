import { Request, Response, NextFunction } from 'express';

export const geofenceController = {
  getGeofences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, geofences: [] });
    } catch (err) {
      next(err);
    }
  },

  createGeofence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(201).json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  deleteGeofence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
};
