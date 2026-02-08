import { Worker, Job } from "bullmq";
import prisma from "../../lib/prisma";
import { generatePage, type SSEEmitter } from "../../ai/agent";
import { setCache, invalidateGraphCache } from "../../lib/redis";
import {
  addExtractJob,
  getRedisUrl,
  PREFIX,
  type EnrichJobData,
} from "../queues";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function createSilentEmitter(): SSEEmitter {
  return {
    stepStart: async () => {},
    stepComplete: async () => {},
    stepError: async () => {},
    contentChunk: async () => {},
    entityFound: async () => {},
    complete: async () => {},
    error: async () => {},
  };
}

async function processEnrichJob(job: Job<EnrichJobData>) {
  const { entityId, entityName, entityType } = job.data;

  const slug = slugify(entityName);

  await job.updateProgress(5);

  const existingPage = await prisma.page.findFirst({
    where: { slug, status: "PUBLISHED" },
  });

  if (existingPage) {
    return {
      entityId,
      entityName,
      skipped: true,
      reason: "Page already exists",
      pageId: existingPage.id,
    };
  }

  await job.updateProgress(10);

  const emitter = createSilentEmitter();
  const query = `${entityName} (${entityType.toLowerCase()})`;

  const { content, entities } = await generatePage(
    { query, provider: "google" },
    emitter,
  );

  await job.updateProgress(70);

  const title = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  const page = await prisma.$transaction(async (tx) => {
    const savedPage = await tx.page.upsert({
      where: { slug },
      create: {
        slug,
        title,
        content,
        status: "PUBLISHED",
      },
      update: {
        content,
        status: "PUBLISHED",
        updatedAt: new Date(),
      },
    });

    for (const entity of entities) {
      const normalizedName = entity.name.toLowerCase().trim();

      const dbEntity = await tx.entity.upsert({
        where: { normalizedName },
        create: {
          name: entity.name,
          normalizedName,
          type: entity.type,
        },
        update: {},
      });

      await tx.pageEntity.upsert({
        where: {
          pageId_entityId: {
            pageId: savedPage.id,
            entityId: dbEntity.id,
          },
        },
        create: {
          pageId: savedPage.id,
          entityId: dbEntity.id,
          relevance: entity.relevance,
        },
        update: {
          relevance: entity.relevance,
        },
      });
    }

    return savedPage;
  });

  await job.updateProgress(90);

  setCache(`page:${slug}`, page, 3600).catch(() => {});
  invalidateGraphCache().catch(() => {});

  await addExtractJob({ pageId: page.id, content });

  await job.updateProgress(100);

  return {
    entityId,
    entityName,
    skipped: false,
    pageId: page.id,
    slug: page.slug,
    entityCount: entities.length,
  };
}

export function createEnrichWorker() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.warn("[EnrichWorker] Redis not available, worker not started");
    return null;
  }

  const worker = new Worker<EnrichJobData>("enrich", processEnrichJob, {
    connection: { url: redisUrl },
    prefix: PREFIX,
    concurrency: 1,
    lockDuration: 180000,
    lockRenewTime: 90000,
    limiter: {
      max: 10,
      duration: 60000,
    },
  });

  worker.on("completed", (job, result) => {
    if (result.skipped) {
      console.log(
        `[EnrichWorker] Job ${job.id} skipped: ${result.entityName} - ${result.reason}`,
      );
    } else {
      console.log(
        `[EnrichWorker] Job ${job.id} completed: created page ${result.slug} for ${result.entityName}`,
      );
    }
  });

  worker.on("failed", (job, err) => {
    console.error(`[EnrichWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[EnrichWorker] Worker error:", err);
  });

  console.log("[EnrichWorker] Started");

  return worker;
}

export async function closeEnrichWorker(worker: Worker | null) {
  if (worker) {
    await worker.close();
    console.log("[EnrichWorker] Closed");
  }
}
