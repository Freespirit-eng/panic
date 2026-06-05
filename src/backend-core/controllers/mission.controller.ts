import { Request, Response } from 'express';
import { missionService } from '../services/mission.service';
import { asyncHandler } from '../middleware/error.middleware';
import { createMissionSchema } from '../validators';
import { MissionStatus } from '../../shared/types';

export const missionController = {
  getMissions: asyncHandler(async (req: Request, res: Response) => {
    const missions = await missionService.getMissions();
    res.status(200).json({ success: true, data: missions });
  }),

  getMissionById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const mission = await missionService.getMissionById(id);
    res.status(200).json({ success: true, data: mission });
  }),

  createMission: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createMissionSchema.parse(req.body);
    const mission = await missionService.createMission(validatedData);
    res.status(201).json({ success: true, data: mission });
  }),

  updateMission: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, ...otherDetails } = req.body;

    let mission;
    
    // If status is provided, enforce state machine transitions
    if (status) {
      mission = await missionService.transitionMissionStatus(id, status as MissionStatus);
    }
    
    // If other fields are provided, apply updates
    if (Object.keys(otherDetails).length > 0) {
      const validatedData = createMissionSchema.partial().parse(otherDetails);
      mission = await missionService.updateMissionDetails(id, validatedData);
    }

    if (!mission) {
      mission = await missionService.getMissionById(id);
    }

    res.status(200).json({ success: true, data: mission });
  })
};
