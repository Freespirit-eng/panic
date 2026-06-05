import { Request, Response } from 'express';
import { geofenceService } from '../services/geofence.service';
import { asyncHandler } from '../middleware/error.middleware';
import { locationSchema } from '../validators';
import { z } from 'zod';

const createGeofenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: locationSchema,
  radiusKm: z.number().positive().default(2.0),
  severityLimit: z.enum(['Critical', 'High', 'Medium', 'Low', 'All']).default('All')
});

export const geofenceController = {
  getGeofences: asyncHandler(async (req: Request, res: Response) => {
    const geofences = await geofenceService.getGeofences();
    res.status(200).json({ success: true, data: geofences });
  }),

  createGeofence: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createGeofenceSchema.parse(req.body);
    const geofence = await geofenceService.createGeofence(validatedData as any);
    res.status(201).json({ success: true, data: geofence });
  })
};
