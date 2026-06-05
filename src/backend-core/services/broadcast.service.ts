import { db } from '../database/db';
import { Broadcast, VolunteerAlertNotification } from '../../shared/types';
import { AppError } from '../middleware/error.middleware';
import { socketService } from './socket.service';

export class BroadcastService {
  private static instance: BroadcastService;

  private constructor() {}

  public static getInstance(): BroadcastService {
    if (!BroadcastService.instance) {
      BroadcastService.instance = new BroadcastService();
    }
    return BroadcastService.instance;
  }

  // In-memory queue storage mimicking Bull queue dashboard states
  public broadcastQueue: {
    jobId: string;
    broadcastId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    attempts: number;
    delay: number;
  }[] = [];

  public async getBroadcasts(): Promise<Broadcast[]> {
    return db.broadcasts;
  }

  public async getQueueJobs() {
    return this.broadcastQueue;
  }

  public async createBroadcast(data: Partial<Broadcast> & { delayMs?: number }): Promise<Broadcast> {
    const newId = `BRD-${String(db.broadcasts.length + 1).padStart(3, '0')}`;
    const delay = data.delayMs || 0;

    const newBroadcast: Broadcast = {
      id: newId,
      type: data.type || 'Emergency Alert',
      title: data.title || 'Emergency Broadcast Warning',
      message: data.message || 'Please standby for further instructions.',
      area: data.area || 'Regional Area',
      timestamp: new Date().toISOString(),
      sentBy: data.sentBy || 'EOC Broadcast Regulator'
    };

    const jobId = `job_${Date.now()}_${newId}`;

    // Add job to simulated Bull queue
    this.broadcastQueue.push({
      jobId,
      broadcastId: newId,
      status: delay > 0 ? 'waiting' : 'active',
      attempts: 0,
      delay
    });

    console.log(`[EOC Queue] Job ${jobId} added to Bull Queue 'broadcast-delivery-queue'. Delay: ${delay}ms`);

    // Simulate background job processor
    setTimeout(() => {
      const job = this.broadcastQueue.find(j => j.jobId === jobId);
      if (job) {
        job.status = 'active';
        job.attempts += 1;
        
        try {
          db.broadcasts.unshift(newBroadcast); // Push to stateful DB
          socketService.emitBroadcastSent(newBroadcast);
          this.distributeAlertsToVolunteers(newBroadcast);
          job.status = 'completed';
          console.log(`[EOC Queue] Job ${jobId} successfully processed by Bull worker. Broadcast ${newId} sent.`);
        } catch (err) {
          job.status = 'failed';
          console.error(`[EOC Queue] Job ${jobId} failed during execution:`, err);
        }
      }
    }, delay);

    // If immediate, return the broadcast. If delayed, return it pre-emptively
    return newBroadcast;
  }

  /**
   * Distribute alert notifications to active volunteers' inbox.
   */
  private distributeAlertsToVolunteers(broadcast: Broadcast): void {
    const activeVolunteers = db.volunteers.filter(v => v.status === 'Available');

    activeVolunteers.forEach(volunteer => {
      const alertNotification: VolunteerAlertNotification = {
        id: `ALRT-${String(Date.now())}-${Math.floor(Math.random() * 1000)}`,
        incidentId: 'GLOBAL',
        title: broadcast.title,
        message: broadcast.message,
        distanceKm: 0, // General broadcast
        timestamp: new Date().toISOString(),
        severity: 'High',
        accepted: false
      };

      volunteer.receivedAlerts.unshift(alertNotification);
    });

    // Notify resource positions clients of state changes
    socketService.emitStatsUpdate();
  }
}

export const broadcastService = BroadcastService.getInstance();
