import { db } from '../database/db';
import { Mission, MissionStatus, MissionTimelineEvent } from '../../shared/types';
import { AppError } from '../middleware/error.middleware';
import { socketService } from './socket.service';

export class MissionService {
  private static instance: MissionService;

  private constructor() {}

  public static getInstance(): MissionService {
    if (!MissionService.instance) {
      MissionService.instance = new MissionService();
    }
    return MissionService.instance;
  }

  public async getMissions(): Promise<Mission[]> {
    return db.missions;
  }

  public async getMissionById(id: string): Promise<Mission> {
    const mission = db.missions.find(m => m.id === id);
    if (!mission) {
      throw new AppError(`Mission with ID ${id} not found`, 404);
    }
    return mission;
  }

  public async createMission(data: Partial<Mission>): Promise<Mission> {
    const newId = `MIS-${String(db.missions.length + 1).padStart(3, '0')}`;
    
    // Auto-create initial timeline event
    const initialTimeline: MissionTimelineEvent[] = [
      {
        timestamp: new Date().toISOString(),
        event: 'Mission initialized and team recommendation compiled.'
      }
    ];

    const newMission: Mission = {
      id: newId,
      incidentId: data.incidentId || '',
      location: data.location || { lat: 0, lng: 0, address: 'Unknown' },
      type: data.type || 'Flood',
      severity: data.severity || 'Medium',
      recommendedTeam: data.recommendedTeam || 'Rescue Team',
      assignedTeam: data.assignedTeam || 'TBD Unit',
      status: data.status || 'Awaiting Assignment',
      eta: data.eta || 'Calculating...',
      summary: data.summary || 'Emergency Mission',
      aiFindings: data.aiFindings || 'Awaiting dispatch report.',
      riskAssessment: data.riskAssessment || 'Awaiting visual assessment.',
      affectedPopulation: data.affectedPopulation || 0,
      requiredResources: data.requiredResources || [],
      recommendedResponsePlan: data.recommendedResponsePlan || [],
      timeline: data.timeline || initialTimeline
    };

    db.missions.unshift(newMission);
    socketService.emitMissionCreated(newMission);

    return newMission;
  }

  /**
   * Enforces State Machine (FSM) rules and transitions mission states.
   */
  public async transitionMissionStatus(id: string, newStatus: MissionStatus): Promise<Mission> {
    const mission = await this.getMissionById(id);
    const oldStatus = mission.status;

    if (oldStatus === newStatus) {
      return mission;
    }

    // Define valid transitions
    const validTransitions: Record<MissionStatus, MissionStatus[]> = {
      'Awaiting Assignment': ['Dispatched'],
      'Dispatched': ['En Route', 'Awaiting Assignment'],
      'En Route': ['Active', 'Dispatched'],
      'Active': ['Resolved', 'En Route'],
      'Resolved': [] // Terminal state
    };

    const allowed = validTransitions[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(`Invalid status transition from ${oldStatus} to ${newStatus}`, 400);
    }

    mission.status = newStatus;
    mission.timeline.push({
      timestamp: new Date().toISOString(),
      event: `Status transitioned from [${oldStatus}] to [${newStatus}]`
    });

    // If resolved, we can auto-resolve or update related incidents if needed
    if (newStatus === 'Resolved') {
      const { incidentService } = require('./incident.service');
      try {
        await incidentService.updateIncident(mission.incidentId, { verification: 'Verified' });
      } catch (err) {
        console.warn(`[MissionService] Failed to auto-verify incident ${mission.incidentId} upon mission resolution.`);
      }
    }

    socketService.emitMissionUpdated(mission);
    return mission;
  }

  public async updateMissionDetails(id: string, data: Partial<Mission>): Promise<Mission> {
    const mission = await this.getMissionById(id);
    
    // Status should only be changed via transition endpoint to enforce FSM rules,
    // but other fields can be updated directly.
    const { status, timeline, ...updatableData } = data;
    Object.assign(mission, updatableData);

    if (data.timeline) {
      mission.timeline = [...mission.timeline, ...data.timeline];
    }

    socketService.emitMissionUpdated(mission);
    return mission;
  }
}

export const missionService = MissionService.getInstance();
