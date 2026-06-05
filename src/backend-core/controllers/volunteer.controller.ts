import { Request, Response } from 'express';
import { volunteerService } from '../services/volunteer.service';
import { asyncHandler } from '../middleware/error.middleware';
import { createVolunteerSchema } from '../validators';

export const volunteerController = {
  getVolunteers: asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radiusKm } = req.query;

    if (lat && lng) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radius = radiusKm ? parseFloat(radiusKm as string) : 5; // Default 5km

      const volunteers = await volunteerService.getAvailableVolunteersNear(latitude, longitude, radius);
      return res.status(200).json({ success: true, data: volunteers });
    }

    const volunteers = await volunteerService.getVolunteers();
    res.status(200).json({ success: true, data: volunteers });
  }),

  getVolunteerById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const volunteer = await volunteerService.getVolunteerById(id);
    res.status(200).json({ success: true, data: volunteer });
  }),

  registerVolunteer: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createVolunteerSchema.parse(req.body);
    const volunteer = await volunteerService.registerVolunteer(validatedData as any);
    res.status(201).json({ success: true, data: volunteer });
  }),

  updateVolunteer: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = createVolunteerSchema.partial().parse(req.body);
    const volunteer = await volunteerService.updateVolunteer(id, validatedData as any);
    res.status(200).json({ success: true, data: volunteer });
  }),

  // PATCH /api/volunteers/:id/alerts/:alertId/accept — Used by M1 Volunteer Standby page
  acceptAlert: asyncHandler(async (req: Request, res: Response) => {
    const { id, alertId } = req.params;
    const volunteer = await volunteerService.acceptAlert(id, alertId);
    res.status(200).json({ success: true, data: volunteer });
  }),

  assignIncident: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { incidentId } = req.body;
    if (!incidentId) {
      return res.status(400).json({ success: false, error: 'Incident ID is required' });
    }
    const volunteer = await volunteerService.assignIncident(id, incidentId);
    res.status(200).json({ success: true, data: volunteer });
  })
};
