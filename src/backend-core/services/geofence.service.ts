import { db } from '../database/db';
import { Geofence } from '../../shared/types';
import { AppError } from '../middleware/error.middleware';
import { socketService } from './socket.service';
import { getHaversineDistance } from './volunteer.service';

export class GeofenceService {
  private static instance: GeofenceService;

  private constructor() {}

  public static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService();
    }
    return GeofenceService.instance;
  }

  public async getGeofences(): Promise<Geofence[]> {
    await this.evaluateGeofences(); // Refresh statuses before returning
    return db.geofences;
  }

  public async createGeofence(data: Partial<Geofence>): Promise<Geofence> {
    const newId = `GEO-${String(db.geofences.length + 1).padStart(3, '0')}`;

    const newGeofence: Geofence = {
      id: newId,
      name: data.name || 'Emergency Monitor Zone',
      location: data.location || { lat: 0, lng: 0, address: 'Unknown' },
      radiusKm: data.radiusKm || 2.0,
      severityLimit: data.severityLimit || 'All',
      status: 'Normal'
    };

    db.geofences.push(newGeofence);
    await this.evaluateGeofences(); // Check if newly created zone is breached
    socketService.emitStatsUpdate();

    return newGeofence;
  }

  /**
   * Evaluates geofences to update status based on proximity of active incidents.
   */
  public async evaluateGeofences(): Promise<void> {
    for (const geofence of db.geofences) {
      let activeThreats = 0;
      let criticalThreats = 0;

      for (const incident of db.incidents) {
        if (incident.verification === 'Flagged') continue; // Skip flagged duplicates

        const distance = getHaversineDistance(
          geofence.location.lat,
          geofence.location.lng,
          incident.location.lat,
          incident.location.lng
        );

        if (distance <= geofence.radiusKm) {
          activeThreats++;
          // If geofence filters by severity
          if (geofence.severityLimit === 'All' || incident.severity === geofence.severityLimit || incident.severity === 'Critical') {
            criticalThreats++;
          }
        }
      }

      if (criticalThreats > 0) {
        geofence.status = 'Breached';
      } else if (activeThreats > 0) {
        geofence.status = 'Monitoring';
      } else {
        geofence.status = 'Normal';
      }
    }
  }
}

export const geofenceService = GeofenceService.getInstance();
