import { Worker, Job } from "bullmq";
import { extractEntitiesWithAI } from "../../ai/agent";
import { extractEntities } from "../../ai/tools/entity.tool";
import {
  addLinkJob,
  getRedisUrl,
  PREFIX,
  type ExtractJobData,
} from "../queues";

async function processExtractJob(job: Job<ExtractJobData>) {
  const { pageId, content } = job.data;

  await job.updateProgress(10);

  let entities;

  try {
    entities = await extractEntitiesWithAI(content, "google");
    await job.updateProgress(80);
  } catch (error) {
    console.error(
      `[ExtractWorker] AI extraction failed for page ${pageId}, using fallback:`,
      error,
    );
    entities = extractEntities(content, 15);
    await job.updateProgress(80);
  }

  await job.updateProgress(90);

  await addLinkJob({ pageId, entities });

  await job.updateProgress(100);

  return {
    pageId,
    entityCount: entities.length,
    entities: entities.map((e) => ({ name: e.name, type: e.type })),
  };
}

export function createExtractWorker() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.warn("[ExtractWorker] Redis not available, worker not started");
    return null;
  }

  const worker = new Worker<ExtractJobData>("extract", processExtractJob, {
    connection: { url: redisUrl },
    prefix: PREFIX,
    concurrency: 3,
    lockDuration: 60000,
    lockRenewTime: 30000,
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[ExtractWorker] Job ${job.id} completed: ${result.entityCount} entities extracted`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[ExtractWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[ExtractWorker] Worker error:", err);
  });

  console.log("[ExtractWorker] Started");

  return worker;
}

export async function closeExtractWorker(worker: Worker | null) {
  if (worker) {
    await worker.close();
    console.log("[ExtractWorker] Closed");
  }
}
