import { Request, Response } from 'express';
import { broadcastService } from '../services/broadcast.service';
import { asyncHandler } from '../middleware/error.middleware';
import { z } from 'zod';

const createBroadcastSchema = z.object({
  type: z.enum(['Emergency Alert', 'Evacuation Notice', 'Road Closure', 'Rescue Update']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  area: z.string().min(1, 'Target area is required'),
  sentBy: z.string().min(1, 'Sender name is required')
});

export const broadcastController = {
  getBroadcasts: asyncHandler(async (req: Request, res: Response) => {
    const broadcasts = await broadcastService.getBroadcasts();
    res.status(200).json({ success: true, data: broadcasts });
  }),

  createBroadcast: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createBroadcastSchema.parse(req.body);
    const broadcast = await broadcastService.createBroadcast(validatedData);
    res.status(201).json({ success: true, data: broadcast });
  }),

  // GET /api/broadcasts/queue — Used by M3 Broadcast Center delivery report panel
  getQueueStatus: asyncHandler(async (req: Request, res: Response) => {
    const jobs = await broadcastService.getQueueJobs();
    res.status(200).json({ success: true, data: jobs });
  })
};
