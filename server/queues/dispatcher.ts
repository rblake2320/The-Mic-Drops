import { Queue, ConnectionOptions } from "bullmq";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6381";

function parseRedisUrl(url: string): ConnectionOptions {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || "localhost",
      port: parseInt(u.port) || 6379,
      password: u.password || undefined,
      db: parseInt(u.pathname.slice(1)) || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    } as ConnectionOptions;
  } catch {
    return { host: "localhost", port: 6379, maxRetriesPerRequest: null } as ConnectionOptions;
  }
}

export const redisConnectionOptions = parseRedisUrl(REDIS_URL);
export let dropQueue: Queue | null = null;

export function initQueue(): boolean {
  try {
    dropQueue = new Queue("drop-dispatch", {
      connection: redisConnectionOptions,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    });

    dropQueue.on("error", (err) => {
      console.warn("[Queue] Redis error:", err.message);
    });

    console.log("[Queue] BullMQ drop-dispatch queue initialized");
    return true;
  } catch (err: any) {
    console.warn("[Queue] Failed to initialize (Redis unavailable):", err.message);
    return false;
  }
}

export async function scheduleDropJob(dropId: string, scheduledAt: Date): Promise<void> {
  if (!dropQueue) {
    console.warn("[Queue] Queue not initialized — drop not scheduled");
    return;
  }
  const delay = Math.max(0, scheduledAt.getTime() - Date.now());
  await dropQueue.add("send-drop", { dropId }, { delay, jobId: `drop-${dropId}` });
  console.log(`[Queue] Drop ${dropId} queued, fires in ${Math.round(delay / 1000)}s`);
}

export async function cancelDropJob(dropId: string): Promise<void> {
  if (!dropQueue) return;
  const job = await dropQueue.getJob(`drop-${dropId}`);
  if (job) {
    await job.remove();
    console.log(`[Queue] Drop ${dropId} job cancelled`);
  }
}
