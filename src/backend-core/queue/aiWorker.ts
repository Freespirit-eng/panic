/**
 * BullMQ AI Workers
 *
 * Workers process queued AI tasks asynchronously.
 * Emits Socket.IO events when each job completes so the frontend updates live.
 *
 * Call startWorkers() from server.ts when REDIS_URL is available.
 */
import { Worker, Job } from 'bullmq';
import { redisConnection, ImageAnalysisJobData, DuplicateCheckJobData, NotifyVolunteerJobData, queueEvents } from './aiQueue';
import { db } from '../database/db';
import { aiService } from '../services/ai.service';
import { socketService } from '../services/socket.service';

// ─── Image Analysis Worker ────────────────────────────────────────────────────

function createImageAnalysisWorker(): Worker | null {
  if (!redisConnection) return null;

  return new Worker<ImageAnalysisJobData>(
    'ai-image-analysis',
    async (job: Job<ImageAnalysisJobData>) => {
      const { incidentId, imageBase64 } = job.data;
      console.log(`[Worker] Processing image analysis for incident ${incidentId}`);

      const result = await aiService.analyzeImage(imageBase64);
      const incident = db.incidents.find(i => i.id === incidentId);

      if (incident && result) {
        Object.assign(incident, {
          type:              result.type              ?? incident.type,
          severity:          result.severity          ?? incident.severity,
          confidence:        result.confidence        ?? incident.confidence,
          peopleDetected:    result.peopleDetected    ?? incident.peopleDetected,
          childrenDetected:  result.childrenDetected  ?? incident.childrenDetected,
          waterLevel:        result.waterLevel        ?? incident.waterLevel,
          recommendedAction: result.recommendedAction ?? incident.recommendedAction,
          reasoning:         result.reasoning         ?? incident.reasoning,
          priorityScore:     result.priorityScore     ?? incident.priorityScore,
          verification:      'Verified',
        });
        db.save();
        socketService.emitIncidentUpdated(incident);
        console.log(`[Worker] ✓ Image analysis complete for ${incidentId}: ${result.type} / ${result.severity}`);
      }

      return { incidentId, result };
    },
    {
      connection: redisConnection as any,
      concurrency: 2,
    },
  );
}

// ─── Duplicate Check Worker ───────────────────────────────────────────────────

function createDuplicateCheckWorker(): Worker | null {
  if (!redisConnection) return null;

  return new Worker<DuplicateCheckJobData>(
    'ai-duplicate-check',
    async (job: Job<DuplicateCheckJobData>) => {
      const { incidentId, description, lat, lng } = job.data;
      console.log(`[Worker] Processing duplicate check for incident ${incidentId}`);

      const result = await aiService.checkDuplicate(description, lat, lng);
      const incident = db.incidents.find(i => i.id === incidentId);

      if (incident) {
        if (result.isDuplicate) {
          incident.verification = 'Flagged';
          incident.duplicates   = (incident.duplicates || 0) + 1;
        } else {
          incident.verification = 'Pending';
        }
        db.save();
        socketService.emitIncidentUpdated(incident);

        if (result.isDuplicate && result.matchedIncidentId) {
          socketService.emitIncidentMerged(incidentId, result.matchedIncidentId);
        }
        console.log(`[Worker] ✓ Duplicate check for ${incidentId}: isDuplicate=${result.isDuplicate}`);
      }

      return { incidentId, result };
    },
    {
      connection: redisConnection as any,
      concurrency: 3,
    },
  );
}

// ─── Notify Volunteer Worker ──────────────────────────────────────────────────

function createNotifyVolunteerWorker(): Worker | null {
  if (!redisConnection) return null;

  return new Worker<NotifyVolunteerJobData>(
    'ai-notify-volunteer',
    async (job: Job<NotifyVolunteerJobData>) => {
      const { volunteerId, incidentId } = job.data;
      const volunteer = db.volunteers.find(v => v.id === volunteerId);
      const incident  = db.incidents.find(i => i.id === incidentId);

      if (!volunteer || !incident) return;

      console.log(`[Worker] Sending async alert to volunteer ${volunteerId} for incident ${incidentId}`);
      socketService.emitVolunteerRegistered(volunteer);
      return { volunteerId, incidentId };
    },
    { connection: redisConnection as any, concurrency: 5 },
  );
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

let workersStarted = false;
let activeWorkers: (Worker | null)[] = [];

export function startWorkers(): void {
  if (workersStarted) return;
  workersStarted = true;
  initWorkers();
}

function initWorkers() {
  // Close any existing active workers first
  activeWorkers.forEach(w => {
    if (w) {
      console.log(`[Worker] Closing active worker for queue: ${w.name}`);
      w.close().catch(err => console.warn(`[Worker] Error closing worker ${w.name}:`, err.message));
    }
  });
  activeWorkers = [];

  if (!redisConnection) {
    console.warn('[Worker] No Redis connection active — workers running in mock (sync) mode.');
    return;
  }

  const imageWorker     = createImageAnalysisWorker();
  const duplicateWorker = createDuplicateCheckWorker();
  const notifyWorker    = createNotifyVolunteerWorker();

  activeWorkers = [imageWorker, duplicateWorker, notifyWorker];

  activeWorkers.forEach(w => {
    if (w) {
      w.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
      });
    }
  });

  console.log(`[Worker] Started ${activeWorkers.filter(Boolean).length} AI workers on active Redis connection.`);
}

// Listen for fallback events to restart workers
queueEvents.on('fallback', () => {
  console.log('[Worker] Redis connection fallback detected. Reinitializing workers...');
  initWorkers();
});
