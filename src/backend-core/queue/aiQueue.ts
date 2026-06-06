/**
 * BullMQ AI Task Queue with Local Redis Failover and Auto-Spawning
 */
import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
const LOCAL_REDIS = 'redis://127.0.0.1:6379';

export const queueEvents = new EventEmitter();

export let redisConnection: IORedis | null = null;
export let queueReady = false;

// ─── Connection Verification Helpers ─────────────────────────────────────────

async function testRedisConnection(url: string, timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: timeoutMs,
    });
    let resolved = false;

    client.on('ready', () => {
      if (!resolved) {
        resolved = true;
        client.disconnect();
        resolve(true);
      }
    });

    client.on('error', () => {
      if (!resolved) {
        resolved = true;
        client.disconnect();
        resolve(false);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.disconnect();
        resolve(false);
      }
    }, timeoutMs + 100);
  });
}

function spawnLocalRedis(): Promise<boolean> {
  return new Promise((resolve) => {
    console.log('[Queue] Spawning local redis-server process...');
    try {
      const child = spawn('redis-server', [], {
        detached: true,
        stdio: 'ignore',
      });
      child.on('error', (err) => {
        console.warn('[Queue] Failed to execute redis-server process:', err.message);
      });
      child.unref();

      // Wait 1.5 seconds for the server to spin up
      setTimeout(async () => {
        const isUp = await testRedisConnection(LOCAL_REDIS, 1000);
        resolve(isUp);
      }, 1500);
    } catch (err: any) {
      console.warn('[Queue] Failed to spawn redis-server command:', err.message);
      resolve(false);
    }
  });
}

// ─── Bootstrap Sequence ──────────────────────────────────────────────────────

let chosenUrl: string | null = null;

async function bootstrapRedis(): Promise<void> {
  if (REDIS_URL) {
    console.log(`[Queue] Testing primary Redis (Upstash) at ${REDIS_URL}...`);
    const primaryOk = await testRedisConnection(REDIS_URL, 2000);
    if (primaryOk) {
      chosenUrl = REDIS_URL;
      console.log(`[Queue] Primary Redis (Upstash) is ONLINE.`);
    } else {
      console.warn(`[Queue] Primary Redis (Upstash) is OFFLINE. Testing local Redis fallback...`);
      const localOk = await testRedisConnection(LOCAL_REDIS, 1000);
      if (localOk) {
        chosenUrl = LOCAL_REDIS;
        console.log(`[Queue] Local Redis fallback is ONLINE.`);
      } else {
        console.log(`[Queue] Local Redis fallback is OFFLINE. Attempting to spin it up...`);
        const spunUp = await spawnLocalRedis();
        if (spunUp) {
          chosenUrl = LOCAL_REDIS;
          console.log(`[Queue] Spun up local Redis successfully.`);
        } else {
          console.error(`[Queue] Failed to spin up local Redis. Running in mock (sync) mode.`);
        }
      }
    }
  } else {
    console.log(`[Queue] REDIS_URL not configured. Testing local Redis...`);
    const localOk = await testRedisConnection(LOCAL_REDIS, 1500);
    if (localOk) {
      chosenUrl = LOCAL_REDIS;
      console.log(`[Queue] Local Redis is ONLINE.`);
    } else {
      console.log(`[Queue] Local Redis is OFFLINE. Attempting to spin it up...`);
      const spunUp = await spawnLocalRedis();
      if (spunUp) {
        chosenUrl = LOCAL_REDIS;
        console.log(`[Queue] Spun up local Redis successfully.`);
      } else {
        console.error(`[Queue] Failed to spin up local Redis. Running in mock (sync) mode.`);
      }
    }
  }

  if (chosenUrl) {
    redisConnection = new IORedis(chosenUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      tls: chosenUrl.startsWith('rediss://') ? {} : undefined,
    });

    redisConnection.on('ready', () => {
      queueReady = true;
      console.log(`[Queue] Redis connection active & ready on ${chosenUrl}.`);
    });

    redisConnection.on('error', (err) => {
      console.warn(`[Queue] Redis connection error on ${chosenUrl}: ${err.message}`);
      queueReady = false;
      handleRuntimeFallback();
    });
  }
}

// ─── Runtime Fallback ────────────────────────────────────────────────────────

let runtimeFallbackTriggered = false;

async function handleRuntimeFallback() {
  if (chosenUrl !== REDIS_URL || runtimeFallbackTriggered) return;
  runtimeFallbackTriggered = true;

  console.warn(`[Queue] Runtime failure on primary Redis (Upstash). Initiating fallback sequence...`);

  try {
    redisConnection?.disconnect();
  } catch (e) {}

  let localOk = await testRedisConnection(LOCAL_REDIS, 1000);
  if (!localOk) {
    localOk = await spawnLocalRedis();
  }

  if (localOk) {
    console.log(`[Queue] Switching connection to local Redis fallback at ${LOCAL_REDIS}...`);
    chosenUrl = LOCAL_REDIS;
    redisConnection = new IORedis(LOCAL_REDIS, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 3000,
    });

    redisConnection.on('ready', () => {
      queueReady = true;
      console.log(`[Queue] Runtime fallback to local Redis successful.`);
      rebuildQueues();
      queueEvents.emit('fallback', redisConnection);
    });

    redisConnection.on('error', (err) => {
      console.error(`[Queue] Local Redis fallback connection error: ${err.message}`);
      queueReady = false;
    });
  } else {
    console.error(`[Queue] Runtime fallback failed: local Redis could not be reached or started. Queue will enter mock mode.`);
    redisConnection = null;
    queueReady = false;
    rebuildQueues();
    queueEvents.emit('fallback', null);
  }
}

function rebuildQueues() {
  imageAnalysisQueue = makeQueue('ai-image-analysis');
  duplicateCheckQueue = makeQueue('ai-duplicate-check');
  notifyVolunteerQueue = makeQueue('ai-notify-volunteer');
}

// Run bootstrap (blocks module export resolution briefly during connection checks)
await bootstrapRedis();

// ─── Queue factory ────────────────────────────────────────────────────────────

function makeQueue(name: string): Queue | null {
  if (!redisConnection) return null;
  const opts: QueueOptions = {
    connection: redisConnection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  };
  return new Queue(name, opts);
}

// ─── Queues ───────────────────────────────────────────────────────────────────

export let imageAnalysisQueue  = makeQueue('ai-image-analysis');
export let duplicateCheckQueue = makeQueue('ai-duplicate-check');
export let notifyVolunteerQueue= makeQueue('ai-notify-volunteer');

// ─── Job type definitions ─────────────────────────────────────────────────────

export interface ImageAnalysisJobData {
  incidentId: string;
  imageBase64: string;
}

export interface DuplicateCheckJobData {
  incidentId: string;
  description: string;
  lat: number;
  lng: number;
}

export interface NotifyVolunteerJobData {
  volunteerId: string;
  incidentId: string;
}
