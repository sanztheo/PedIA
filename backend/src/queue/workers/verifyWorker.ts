import { Worker, Job } from "bullmq";
import prisma from "../../lib/prisma";
import { invalidateGraphCache } from "../../lib/redis";
import { GraphService } from "../../services/graph.service";
import { getRedisUrl, PREFIX, type VerifyJobData } from "../queues";

const BATCH_SIZE = 50;
const MIN_PREDICTION_SCORE = 0.3;

async function processVerifyJob(job: Job<VerifyJobData>) {
  const { pageId, fullScan } = job.data;

  await job.updateProgress(5);

  let missingBacklinksCreated = 0;
  let predictedLinksCreated = 0;

  if (pageId) {
    const missingBacklinks = await GraphService.detectMissingBacklinks(pageId);
    await job.updateProgress(30);

    missingBacklinksCreated =
      await GraphService.createMissingBacklinks(missingBacklinks);
    await job.updateProgress(60);

    const pageEntities = await prisma.pageEntity.findMany({
      where: { pageId },
      select: { entityId: true },
      take: 10,
    });

    for (const { entityId } of pageEntities) {
      const predictions = await GraphService.predictMissingLinks(entityId, 5);

      for (const prediction of predictions) {
        if (prediction.score < MIN_PREDICTION_SCORE) continue;

        try {
          await prisma.entityRelation.upsert({
            where: {
              fromEntityId_toEntityId_type: {
                fromEntityId: entityId,
                toEntityId: prediction.entityId,
                type: "RELATED_TO",
              },
            },
            update: {
              strength: { increment: 0.05 },
            },
            create: {
              fromEntityId: entityId,
              toEntityId: prediction.entityId,
              type: "RELATED_TO",
              strength: prediction.score,
            },
          });
          predictedLinksCreated++;
        } catch {
          continue;
        }
      }
    }

    await job.updateProgress(90);
  } else if (fullScan) {
    const pages = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
      orderBy: { updatedAt: "desc" },
      take: BATCH_SIZE,
    });

    await job.updateProgress(10);

    const progressPerPage = 80 / pages.length;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const missingBacklinks = await GraphService.detectMissingBacklinks(
        page.id,
      );
      const created =
        await GraphService.createMissingBacklinks(missingBacklinks);
      missingBacklinksCreated += created;

      await job.updateProgress(10 + Math.round((i + 1) * progressPerPage));
    }

    await job.updateProgress(90);
  }

  invalidateGraphCache().catch(() => {});

  await job.updateProgress(100);

  return {
    pageId: pageId || "full-scan",
    missingBacklinksCreated,
    predictedLinksCreated,
  };
}

export function createVerifyWorker() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.warn("[VerifyWorker] Redis not available, worker not started");
    return null;
  }

  const worker = new Worker<VerifyJobData>("verify", processVerifyJob, {
    connection: { url: redisUrl },
    prefix: PREFIX,
    concurrency: 1,
    lockDuration: 120000,
    lockRenewTime: 60000,
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[VerifyWorker] Job ${job.id} completed: ${result.missingBacklinksCreated} backlinks, ${result.predictedLinksCreated} predictions for ${result.pageId}`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[VerifyWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[VerifyWorker] Worker error:", err);
  });

  console.log("[VerifyWorker] Started");

  return worker;
}

export async function closeVerifyWorker(worker: Worker | null) {
  if (worker) {
    await worker.close();
    console.log("[VerifyWorker] Closed");
  }
}
