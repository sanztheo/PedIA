import { Worker, Job } from "bullmq";
import { EmbeddingService } from "../../services/embedding.service";
import { getRedisUrl, PREFIX, type EmbedJobData } from "../queues";

async function processEmbedJob(job: Job<EmbedJobData>) {
  const { pageId, content } = job.data;

  await job.updateProgress(10);

  const chunkCount = await EmbeddingService.embedPage(pageId, content);

  await job.updateProgress(100);

  return {
    pageId,
    chunkCount,
  };
}

export function createEmbedWorker() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.warn("[EmbedWorker] Redis not available, worker not started");
    return null;
  }

  const worker = new Worker<EmbedJobData>("embed", processEmbedJob, {
    connection: { url: redisUrl },
    prefix: PREFIX,
    concurrency: 2,
    lockDuration: 120000,
    lockRenewTime: 60000,
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[EmbedWorker] Job ${job.id} completed: ${result.chunkCount} chunks embedded for page ${result.pageId}`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[EmbedWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[EmbedWorker] Worker error:", err);
  });

  console.log("[EmbedWorker] Started");

  return worker;
}

export async function closeEmbedWorker(worker: Worker | null) {
  if (worker) {
    await worker.close();
    console.log("[EmbedWorker] Closed");
  }
}
