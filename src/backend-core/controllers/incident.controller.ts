import { Request, Response } from 'express';
import { incidentService } from '../services/incident.service';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createIncidentSchema } from '../validators';

import { db } from '../database/db';

export const incidentController = {
  getIncidents: asyncHandler(async (req: Request, res: Response) => {
    const { severity, since } = req.query;
    const incidents = await incidentService.getIncidents(severity as string, since as string);
    res.status(200).json({ success: true, data: incidents });
  }),

  liveQuery: asyncHandler(async (req: Request, res: Response) => {
    const { severity } = req.query;
    const targetSeverity = severity || 'Critical';
    const rows = db.runRawQuery(
      `SELECT id, severity, timestamp, json_extract(data, '$.type') as type, json_extract(data, '$.peopleDetected') as peopleDetected FROM incidents WHERE severity = ?`,
      [targetSeverity]
    );
    res.status(200).json({
      success: true,
      query: `SELECT id, severity, timestamp, json_extract(data, '$.type') as type, json_extract(data, '$.peopleDetected') as peopleDetected FROM incidents WHERE severity = '${targetSeverity}'`,
      rows
    });
  }),

  getIncidentById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const incident = await incidentService.getIncidentById(id);
    res.status(200).json({ success: true, data: incident });
  }),

  createIncident: asyncHandler(async (req: Request, res: Response) => {
    // Inject uploaded file location if parsed by upload middleware
    const fileData = (req as any).file;
    if (fileData && fileData.location) {
      req.body.image = fileData.location;
    }
    
    // Validate request body
    const validatedData = createIncidentSchema.parse(req.body);
    const incident = await incidentService.createIncident(validatedData as any);
    res.status(201).json({ success: true, data: incident });
  }),

  updateIncident: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    // Partial schema validation for updates
    const validatedData = createIncidentSchema.partial().parse(req.body);
    const incident = await incidentService.updateIncident(id, validatedData as any);
    res.status(200).json({ success: true, data: incident });
  }),

  deleteIncident: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await incidentService.deleteIncident(id);
    res.status(200).json({ success: true, data: { id } });
  }),

  mergeIncident: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetIncidentId } = req.body;
    const incident = await incidentService.mergeIncident(id, targetIncidentId);
    res.status(200).json({ success: true, data: incident });
  }),

  // PATCH /api/incidents/:id/verify — Used by M1 after duplicate-check banner confirmation
  verifyIncident: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { verification } = req.body;
    if (!['Verified', 'Pending', 'Flagged'].includes(verification)) {
      throw new AppError('Invalid verification status', 400);
    }
    const incident = await incidentService.updateIncident(id, { verification });
    res.status(200).json({ success: true, data: incident });
  }),

  // GET /api/incidents/stats — Used by M3 Command Center KPI cards on initial load
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await incidentService.getStats();
    res.status(200).json({ success: true, data: stats });
  })
};
