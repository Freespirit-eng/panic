import { db } from '../database/db';
import { Incident } from '../../shared/types';
import { AppError } from '../middleware/error.middleware';
import { socketService } from './socket.service';
import { aiService } from './ai.service';

export class IncidentService {
  private static instance: IncidentService;

  private constructor() {}

  public static getInstance(): IncidentService {
    if (!IncidentService.instance) {
      IncidentService.instance = new IncidentService();
    }
    return IncidentService.instance;
  }

  public async getIncidents(): Promise<Incident[]> {
    return db.incidents;
  }

  public async getStats() {
    const all = db.incidents;
    return {
      activeIncidents: all.length,
      criticalEmergencies: all.filter(i => i.severity === 'Critical').length,
      respondersDeployed: db.missions.filter(m => m.status !== 'Resolved').length,
      citizensImpacted: all.reduce((acc, i) => acc + i.peopleDetected, 0),
      aiVerifiedReports: all.filter(i => i.verification === 'Verified').length
    };
  }

  public async getIncidentById(id: string): Promise<Incident> {
    const incident = db.incidents.find(i => i.id === id);
    if (!incident) {
      throw new AppError(`Incident with ID ${id} not found`, 404);
    }
    return incident;
  }

  public async createIncident(data: Partial<Incident>): Promise<Incident> {
    const newId = `INC-${String(db.incidents.length + 1).padStart(3, '0')}`;
    
    // Auto-calculate simple priority score based on severity and victims
    let severityWeight = 10;
    if (data.severity === 'Critical') severityWeight = 50;
    else if (data.severity === 'High') severityWeight = 30;
    else if (data.severity === 'Medium') severityWeight = 20;

    const people = data.peopleDetected || 0;
    const priorityScore = Math.min(100, severityWeight + (people * 3));

    // Automated check for duplicate reporting using AI gateway
    const checkResult = await aiService.checkDuplicate(
      data.recommendedAction || 'Emergency Report',
      data.location?.lat || 0,
      data.location?.lng || 0
    );

    const newIncident: Incident = {
      id: newId,
      type: data.type || 'Flood',
      severity: data.severity || 'Medium',
      confidence: data.confidence || 90,
      location: data.location || { lat: 0, lng: 0, address: 'Unknown' },
      timestamp: new Date().toISOString(),
      verification: checkResult.isDuplicate ? 'Flagged' : 'Pending',
      duplicates: checkResult.isDuplicate ? 1 : 0,
      peopleDetected: data.peopleDetected || 0,
      childrenDetected: data.childrenDetected || 0,
      waterLevel: data.waterLevel || 'N/A',
      recommendedAction: data.recommendedAction || 'Standby for EOC dispatch plan.',
      priorityScore,
      reasoning: data.reasoning || ['Incident report submitted by citizen']
    };

    db.incidents.unshift(newIncident); // Prepend so new items show first
    db.save();

    // Socket emission
    socketService.emitIncidentCreated(newIncident);

    // If duplicate check flagged a match, emit a merge helper event automatically
    if (checkResult.isDuplicate && checkResult.matchedIncidentId) {
      socketService.emitIncidentMerged(newIncident.id, checkResult.matchedIncidentId);
    }

    return newIncident;
  }

  public async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    const incident = await this.getIncidentById(id);
    
    Object.assign(incident, data);
    db.save();
    
    socketService.emitIncidentUpdated(incident);
    return incident;
  }

  public async deleteIncident(id: string): Promise<void> {
    const index = db.incidents.findIndex(i => i.id === id);
    if (index === -1) {
      throw new AppError(`Incident with ID ${id} not found`, 404);
    }
    db.incidents.splice(index, 1);
    db.save();
    socketService.emitStatsUpdate();
  }

  public async mergeIncident(id: string, targetIncidentId: string): Promise<Incident> {
    const source = await this.getIncidentById(id);
    const target = await this.getIncidentById(targetIncidentId);

    // Mark source as duplicate of target
    source.verification = 'Flagged';
    target.duplicates += 1;
    db.save();

    socketService.emitIncidentUpdated(target);
    socketService.emitIncidentMerged(source.id, target.id);

    return target;
  }
}

export const incidentService = IncidentService.getInstance();
