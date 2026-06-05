import { db } from '../database/db';
import { Volunteer, VolunteerAlertNotification } from '../../shared/types';
import { AppError } from '../middleware/error.middleware';
import { socketService } from './socket.service';

/**
 * Calculates the distance between two geographical coordinates in kilometers.
 */
export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class VolunteerService {
  private static instance: VolunteerService;

  private constructor() {}

  public static getInstance(): VolunteerService {
    if (!VolunteerService.instance) {
      VolunteerService.instance = new VolunteerService();
    }
    return VolunteerService.instance;
  }

  public async getVolunteers(): Promise<Volunteer[]> {
    return db.volunteers;
  }

  public async getVolunteerById(id: string): Promise<Volunteer> {
    const volunteer = db.volunteers.find(v => v.id === id);
    if (!volunteer) {
      throw new AppError(`Volunteer with ID ${id} not found`, 404);
    }
    return volunteer;
  }

  public async registerVolunteer(data: Partial<Volunteer>): Promise<Volunteer> {
    const newId = `VOL-${String(db.volunteers.length + 1).padStart(3, '0')}`;
    
    const newVolunteer: Volunteer = {
      id: newId,
      name: data.name || 'Anonymous Rescuer',
      phone: data.phone || '000-0000',
      location: data.location || { lat: 0, lng: 0, address: 'Unknown' },
      status: 'Available',
      skills: data.skills || [],
      equipment: data.equipment || [],
      notifyRadiusKm: data.notifyRadiusKm || 5,
      receivedAlerts: [],
      age: data.age,
      gender: data.gender
    };

    db.volunteers.push(newVolunteer);
    db.save();
    socketService.emitVolunteerRegistered(newVolunteer);

    return newVolunteer;
  }

  public async updateVolunteer(id: string, data: Partial<Volunteer>): Promise<Volunteer> {
    const volunteer = await this.getVolunteerById(id);
    
    // Constraints: Volunteers who are currently `On Mission` cannot toggle their status
    if (data.status && data.status !== volunteer.status && volunteer.status === 'On Mission') {
      throw new AppError('Cannot change status while on a mission', 400);
    }

    Object.assign(volunteer, data);
    db.save();
    
    socketService.emitVolunteerRegistered(volunteer);
    socketService.emitStatsUpdate();
    return volunteer;
  }

  /**
   * Proximity query (implements TS simulation of PostGIS ST_DWithin query).
   */
  public async getAvailableVolunteersNear(lat: number, lng: number, radiusKm: number): Promise<Volunteer[]> {
    return db.volunteers.filter(volunteer => {
      if (volunteer.status !== 'Available') return false;
      const distance = getHaversineDistance(
        lat, 
        lng, 
        volunteer.location.lat, 
        volunteer.location.lng
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Mark a specific alert notification as accepted for a volunteer.
   * Called by M1 Volunteer Standby page when a volunteer taps "Accept".
   */
  public async acceptAlert(volunteerId: string, alertId: string): Promise<Volunteer> {
    const volunteer = await this.getVolunteerById(volunteerId);
    const alert = volunteer.receivedAlerts.find(a => a.id === alertId);
    if (!alert) {
      throw new AppError(`Alert ${alertId} not found for volunteer ${volunteerId}`, 404);
    }
    alert.accepted = true;
    volunteer.status = 'On Mission';
    db.save();
    socketService.emitStatsUpdate();
    return volunteer;
  }

  /**
   * Assigns a specific incident to a volunteer.
   */
  public async assignIncident(volunteerId: string, incidentId: string): Promise<Volunteer> {
    const volunteer = await this.getVolunteerById(volunteerId);
    const incident = db.incidents.find(i => i.id === incidentId);
    if (!incident) {
      throw new AppError(`Incident with ID ${incidentId} not found`, 404);
    }

    const distance = getHaversineDistance(
      incident.location.lat,
      incident.location.lng,
      volunteer.location.lat,
      volunteer.location.lng
    );

    const alertNotification: VolunteerAlertNotification = {
      id: `ALRT-${String(Date.now())}-${Math.floor(Math.random() * 1000)}`,
      incidentId: incident.id,
      title: `Dispatch Request: ${incident.type}`,
      message: `Please assist with a ${incident.type} emergency at ${incident.location.address}.`,
      distanceKm: parseFloat(distance.toFixed(2)),
      timestamp: new Date().toISOString(),
      severity: incident.severity,
      accepted: false
    };

    volunteer.receivedAlerts.unshift(alertNotification);
    db.save();
    socketService.emitStatsUpdate();
    return volunteer;
  }
}

export const volunteerService = VolunteerService.getInstance();
