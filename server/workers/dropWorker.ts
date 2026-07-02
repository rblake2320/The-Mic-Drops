import { Worker } from "bullmq";
import { redisConnectionOptions } from "../queues/dispatcher.js";
import { sendDropToSubscribers } from "../push/index.js";
import { recordDropProvenance } from "../provenance/ledger.js";
import { db } from "../db.js";

export function startDropWorker(): Worker | null {
  if (!redisConnectionOptions) {
    console.warn("[Worker] Redis options not available — drop worker not started");
    return null;
  }

  let worker: Worker;
  try {
    worker = new Worker(
      "drop-dispatch",
      async (job) => {
        const { dropId } = job.data as { dropId: string };
        console.log(`[Worker] Processing drop ${dropId}`);

        const updated = await db.drop.update({
          where: { id: dropId },
          data: { status: "SENT", sentAt: new Date() },
        });

        // Scheduled drops enter the provenance chain at the moment they publish.
        await recordDropProvenance({
          dropId: updated.id,
          title: updated.title,
          content: updated.content,
          voiceName: updated.voiceName,
          category: updated.category,
          anchorTitle: updated.anchorTitle,
          anchorSource: updated.anchorSource,
          anchorLink: updated.anchorLink,
          anchorTimeCode: updated.anchorTimeCode,
          transcriptContext: updated.transcriptContext,
        });

        await sendDropToSubscribers(dropId);
      },
      { connection: redisConnectionOptions, concurrency: 5 }
    );

    worker.on("completed", (job) => {
      console.log(`[Worker] Drop ${job.data.dropId} dispatched`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] Drop ${job?.data.dropId} failed:`, err.message);
    });

    worker.on("error", (err) => {
      console.warn("[Worker] Redis error:", err.message);
    });

    console.log("[Worker] Drop dispatch worker started");
    return worker;
  } catch (err: any) {
    console.warn("[Worker] Could not start (Redis unavailable):", err.message);
    return null;
  }
}
