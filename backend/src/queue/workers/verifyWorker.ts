import { Worker, Job } from "bullmq";
import prisma from "../../lib/prisma";
import { getRedisUrl, PREFIX, type VerifyJobData } from "../queues";

interface VerifyResult {
  pageId: string;
  bidirectionalFixed: number;
  missingLinksDetected: number;
}

async function processVerifyJob(job: Job<VerifyJobData>): Promise<VerifyResult> {
  const { pageId, checkBidirectional, checkMissingLinks } = job.data;

  let bidirectionalFixed = 0;
  let missingLinksDetected = 0;

  await job.updateProgress(10);

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      entities: {
        include: { entity: true },
      },
      outgoingLinks: {
        include: { targetPage: true },
      },
    },
  });

  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  await job.updateProgress(30);

  if (checkBidirectional) {
    for (const link of page.outgoingLinks) {
      const reverseLink = await prisma.pageLink.findFirst({
        where: {
          sourcePageId: link.targetPageId,
          targetPageId: pageId,
        },
      });

      if (!reverseLink) {
        await prisma.pageLink.create({
          data: {
            sourcePageId: link.targetPageId,
            targetPageId: pageId,
          },
        });
        bidirectionalFixed++;
      }
    }
  }

  await job.updateProgress(60);

  if (checkMissingLinks) {
    for (const pe of page.entities) {
      const entityPage = await prisma.page.findFirst({
        where: {
          slug: pe.entity.normalizedName.replace(/\s+/g, "-"),
          status: "PUBLISHED",
        },
      });

      if (entityPage) {
        const existingLink = await prisma.pageLink.findFirst({
          where: {
            sourcePageId: pageId,
            targetPageId: entityPage.id,
          },
        });

        if (!existingLink) {
          await prisma.pageLink.create({
            data: {
              sourcePageId: pageId,
              targetPageId: entityPage.id,
            },
          });
          missingLinksDetected++;
        }
      }
    }
  }

  await job.updateProgress(100);

  return { pageId, bidirectionalFixed, missingLinksDetected };
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
      `[VerifyWorker] Job ${job.id} completed: ${result.bidirectionalFixed} bidirectional fixed, ${result.missingLinksDetected} missing links detected`,
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
