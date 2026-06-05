import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Incident, Mission, Volunteer, Broadcast } from '../../shared/types';
import { db } from '../database/db';
import { decodeMockToken } from '../controllers/auth.controller';

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize Socket.IO on the HTTP server.
   */
  public initialize(server: HTTPServer): Server {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for simplicity in local dev setup
        methods: ['GET', 'POST']
      }
    });

    console.log('[EOC Socket] Socket.IO server initialized.');

    // JWT Handshake Verification Middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (token) {
        const tokenString = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
        try {
          const decoded = decodeMockToken(tokenString);
          if (decoded) {
            (socket as any).user = decoded;
            console.log(`[EOC Socket] Client authenticated: ${decoded.username} (${decoded.role})`);
          }
        } catch (err) {
          console.warn('[EOC Socket] Token handshake decoding failed.');
        }
      }
      next();
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`[EOC Socket] Client connected: ${socket.id}`);

      // Allow clients to subscribe to specific rooms
      socket.on('join_room', (roomName: string) => {
        const allowedRooms = [
          'incidents_feed',
          'stats_update',
          'mission_update',
          'resource_positions',
          'broadcast_room',    // M3 Broadcast Center
          'geofence_alerts'    // M3 GIS Zone monitoring
        ];
        if (allowedRooms.includes(roomName)) {
          socket.join(roomName);
          console.log(`[EOC Socket] Client ${socket.id} joined room: ${roomName}`);
          socket.emit('joined', { room: roomName });
        } else {
          console.warn(`[EOC Socket] Client ${socket.id} tried to join invalid room: ${roomName}`);
          socket.emit('error_message', { message: `Invalid room: ${roomName}` });
        }
      });

      socket.on('leave_room', (roomName: string) => {
        socket.leave(roomName);
        console.log(`[EOC Socket] Client ${socket.id} left room: ${roomName}`);
      });

      socket.on('disconnect', () => {
        console.log(`[EOC Socket] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Helper to verify initialization.
   */
  private getIO(): Server {
    if (!this.io) {
      throw new Error('SocketService is not initialized. Please call initialize() first.');
    }
    return this.io;
  }

  // --- EMIT HELPER METHODS ---

  public emitIncidentCreated(incident: Incident): void {
    console.log(`[EOC Socket] Emitting incident_created: ${incident.id}`);
    this.getIO().to('incidents_feed').emit('incident_created', incident);
    this.emitStatsUpdate();
  }

  public emitIncidentUpdated(incident: Incident): void {
    console.log(`[EOC Socket] Emitting incident_updated: ${incident.id}`);
    this.getIO().to('incidents_feed').emit('incident_updated', incident);
    this.emitStatsUpdate();
  }

  public emitIncidentMerged(incidentId: string, targetIncidentId: string): void {
    console.log(`[EOC Socket] Emitting incident_merged: ${incidentId} -> ${targetIncidentId}`);
    this.getIO().to('incidents_feed').emit('incident_merged', { incidentId, targetIncidentId });
    this.emitStatsUpdate();
  }

  public emitMissionCreated(mission: Mission): void {
    console.log(`[EOC Socket] Emitting mission_created: ${mission.id}`);
    this.getIO().to('mission_update').emit('mission_created', mission);
    this.emitStatsUpdate();
  }

  public emitMissionUpdated(mission: Mission): void {
    console.log(`[EOC Socket] Emitting mission_updated: ${mission.id}`);
    this.getIO().to('mission_update').emit('mission_updated', mission);
    this.emitStatsUpdate();
  }

  public emitVolunteerRegistered(volunteer: Volunteer): void {
    console.log(`[EOC Socket] Emitting volunteer_registered: ${volunteer.id}`);
    this.getIO().to('resource_positions').emit('volunteer_registered', volunteer);
    this.emitStatsUpdate();
  }

  public emitBroadcastSent(broadcast: Broadcast): void {
    console.log(`[EOC Socket] Emitting broadcast_sent: ${broadcast.id}`);
    this.getIO().emit('broadcast_sent', broadcast);
    this.getIO().to('broadcast_room').emit('broadcast_sent', broadcast);
  }

  /**
   * Emitted when geofence evaluation detects a status change to 'Breached'.
   * M3 GIS Monitoring listens on 'geofence_alerts' room.
   */
  public emitGeofenceBreached(geofenceId: string, incidentId: string): void {
    console.log(`[EOC Socket] Emitting geofence_breached: Zone ${geofenceId} by Incident ${incidentId}`);
    this.getIO().to('geofence_alerts').emit('geofence_breached', { geofenceId, incidentId, timestamp: new Date().toISOString() });
    this.emitStatsUpdate();
  }

  /**
   * Recalculate stats and broadcast them to EOC clients.
   * This updates the active overview counts without manual page refreshes.
   */
  public emitStatsUpdate(): void {
    const activeIncidents = db.incidents.length;
    const criticalEmergencies = db.incidents.filter((i: Incident) => i.severity === 'Critical').length;
    const respondersDeployed = db.missions.filter((m: Mission) => m.status !== 'Resolved').length;
    const citizensImpacted = db.incidents.reduce((acc: number, curr: Incident) => acc + curr.peopleDetected, 0);
    const aiVerifiedReports = db.incidents.filter((i: Incident) => i.verification === 'Verified').length;

    const stats = {
      activeIncidents,
      criticalEmergencies,
      respondersDeployed,
      citizensImpacted,
      aiVerifiedReports
    };

    console.log('[EOC Socket] Broadcasting stats_update:', stats);
    this.getIO().to('stats_update').emit('stats_update', stats);
  }
}

export const socketService = SocketService.getInstance();
