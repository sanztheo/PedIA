import { Worker, Job } from "bullmq";
import prisma from "../../lib/prisma";
import { addEnrichJob, getRedisUrl, PREFIX, type LinkJobData } from "../queues";

const IMPORTANT_TYPES = ["PERSON", "ORGANIZATION", "LOCATION", "EVENT"];
const MIN_RELEVANCE_FOR_ENRICH = 0.7;

async function processLinkJob(job: Job<LinkJobData>) {
  const { pageId, entities } = job.data;

  if (!entities.length) {
    return { pageId, linked: 0, relations: 0, enrichQueued: 0 };
  }

  await job.updateProgress(10);

  const upsertedEntities = await Promise.all(
    entities.map((entity) =>
      prisma.entity.upsert({
        where: { normalizedName: entity.name.toLowerCase().trim() },
        update: { type: entity.type },
        create: {
          name: entity.name,
          normalizedName: entity.name.toLowerCase().trim(),
          type: entity.type,
        },
      }),
    ),
  );

  await job.updateProgress(40);

  await Promise.all(
    upsertedEntities.map((entity, idx) =>
      prisma.pageEntity.upsert({
        where: { pageId_entityId: { pageId, entityId: entity.id } },
        update: { relevance: entities[idx].relevance },
        create: {
          pageId,
          entityId: entity.id,
          relevance: entities[idx].relevance,
          mentions: 1,
        },
      }),
    ),
  );

  await job.updateProgress(60);

  let relationsCreated = 0;

  if (upsertedEntities.length > 1) {
    const relationPairs: Array<{ fromId: string; toId: string }> = [];

    for (let i = 0; i < upsertedEntities.length - 1; i++) {
      for (let j = i + 1; j < upsertedEntities.length; j++) {
        relationPairs.push({
          fromId: upsertedEntities[i].id,
          toId: upsertedEntities[j].id,
        });
      }
    }

    const limitedPairs = relationPairs.slice(0, 50);

    await Promise.all(
      limitedPairs.map((pair) =>
        prisma.entityRelation
          .upsert({
            where: {
              fromEntityId_toEntityId_type: {
                fromEntityId: pair.fromId,
                toEntityId: pair.toId,
                type: "RELATED_TO",
              },
            },
            update: {
              strength: { increment: 0.1 },
            },
            create: {
              fromEntityId: pair.fromId,
              toEntityId: pair.toId,
              type: "RELATED_TO",
              strength: 0.5,
            },
          })
          .catch((err) => {
            console.error(
              `[LinkWorker] Failed to create relation ${pair.fromId} -> ${pair.toId}:`,
              err.message,
            );
            return null;
          }),
      ),
    );

    relationsCreated = limitedPairs.length;
  }

  await job.updateProgress(80);

  let enrichQueued = 0;

  const importantEntities = upsertedEntities.filter((entity, idx) => {
    const originalEntity = entities[idx];
    return (
      IMPORTANT_TYPES.includes(entity.type) &&
      originalEntity.relevance >= MIN_RELEVANCE_FOR_ENRICH
    );
  });

  for (const entity of importantEntities.slice(0, 5)) {
    const existingPage = await prisma.page.findFirst({
      where: {
        slug: entity.normalizedName.replace(/\s+/g, "-"),
        status: "PUBLISHED",
      },
    });

    if (!existingPage) {
      await addEnrichJob({
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
      });
      enrichQueued++;
    }
  }

  await job.updateProgress(100);

  return {
    pageId,
    linked: upsertedEntities.length,
    relations: relationsCreated,
    enrichQueued,
  };
}

export function createLinkWorker() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    console.warn("[LinkWorker] Redis not available, worker not started");
    return null;
  }

  const worker = new Worker<LinkJobData>("link", processLinkJob, {
    connection: { url: redisUrl },
    prefix: PREFIX,
    concurrency: 2,
    lockDuration: 90000,
    lockRenewTime: 45000,
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[LinkWorker] Job ${job.id} completed: ${result.linked} entities linked, ${result.relations} relations, ${result.enrichQueued} enrich jobs queued`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[LinkWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[LinkWorker] Worker error:", err);
  });

  console.log("[LinkWorker] Started");

  return worker;
}

export async function closeLinkWorker(worker: Worker | null) {
  if (worker) {
    await worker.close();
    console.log("[LinkWorker] Closed");
  }
}
