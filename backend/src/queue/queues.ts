import { Queue, FlowProducer, QueueEvents } from "bullmq";
import type { EntityType } from "@prisma/client";

export const PREFIX = "pedia";
const REDIS_URL = process.env.REDIS_URL;

const connectionOpts = REDIS_URL
  ? { connection: { url: REDIS_URL }, prefix: PREFIX }
  : undefined;

export interface ExtractJobData {
  pageId: string;
  content: string;
}

export interface LinkJobData {
  pageId: string;
  entities: Array<{
    name: string;
    type: EntityType;
    relevance: number;
  }>;
}

export interface EnrichJobData {
  entityId: string;
  entityName: string;
  entityType: EntityType;
}

export interface VerifyJobData {
  pageId?: string;
  fullScan?: boolean;
}

export interface EmbedJobData {
  pageId: string;
  content: string;
}

export const extractQueue = connectionOpts
  ? new Queue<ExtractJobData>("extract", connectionOpts)
  : null;

export const linkQueue = connectionOpts
  ? new Queue<LinkJobData>("link", connectionOpts)
  : null;

export const enrichQueue = connectionOpts
  ? new Queue<EnrichJobData>("enrich", connectionOpts)
  : null;

export const verifyQueue = connectionOpts
  ? new Queue<VerifyJobData>("verify", connectionOpts)
  : null;

export const embedQueue = connectionOpts
  ? new Queue<EmbedJobData>("embed", connectionOpts)
  : null;

export const flowProducer = connectionOpts
  ? new FlowProducer(connectionOpts)
  : null;

export const queueEvents = {
  extract: connectionOpts ? new QueueEvents("extract", connectionOpts) : null,
  link: connectionOpts ? new QueueEvents("link", connectionOpts) : null,
  enrich: connectionOpts ? new QueueEvents("enrich", connectionOpts) : null,
  verify: connectionOpts ? new QueueEvents("verify", connectionOpts) : null,
  embed: connectionOpts ? new QueueEvents("embed", connectionOpts) : null,
};

// Prevent unhandled Redis connection errors from crashing the server
const handleError = (name: string) => (err: Error) => {
  console.warn(`[Queue] ${name} connection error: ${err.message}`);
};

extractQueue?.on("error", handleError("extractQueue"));
linkQueue?.on("error", handleError("linkQueue"));
enrichQueue?.on("error", handleError("enrichQueue"));
verifyQueue?.on("error", handleError("verifyQueue"));
embedQueue?.on("error", handleError("embedQueue"));
flowProducer?.on("error", handleError("flowProducer"));
queueEvents.extract?.on("error", handleError("queueEvents.extract"));
queueEvents.link?.on("error", handleError("queueEvents.link"));
queueEvents.enrich?.on("error", handleError("queueEvents.enrich"));
queueEvents.verify?.on("error", handleError("queueEvents.verify"));
queueEvents.embed?.on("error", handleError("queueEvents.embed"));

export function getRedisUrl() {
  return REDIS_URL;
}

export async function addExtractJob(data: ExtractJobData) {
  if (!extractQueue) {
    console.warn("Queue not available, skipping extract job");
    return null;
  }

  return extractQueue.add("extract-entities", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  });
}

export async function addLinkJob(data: LinkJobData) {
  if (!linkQueue) {
    console.warn("Queue not available, skipping link job");
    return null;
  }

  return linkQueue.add("link-entities", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  });
}

export async function addEnrichJob(data: EnrichJobData) {
  if (!enrichQueue) {
    console.warn("Queue not available, skipping enrich job");
    return null;
  }

  return enrichQueue.add("enrich-entity", data, {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  });
}

export async function addVerifyJob(data: VerifyJobData = {}) {
  if (!verifyQueue) {
    console.warn("Queue not available, skipping verify job");
    return null;
  }

  return verifyQueue.add("verify-links", data, {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  });
}

export async function addEmbedJob(data: EmbedJobData) {
  if (!embedQueue) {
    console.warn("Queue not available, skipping embed job");
    return null;
  }

  return embedQueue.add("embed-page", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: false,
  });
}

export async function closeQueues() {
  const closeTasks = [];

  if (extractQueue) closeTasks.push(extractQueue.close());
  if (linkQueue) closeTasks.push(linkQueue.close());
  if (enrichQueue) closeTasks.push(enrichQueue.close());
  if (verifyQueue) closeTasks.push(verifyQueue.close());
  if (embedQueue) closeTasks.push(embedQueue.close());
  if (flowProducer) closeTasks.push(flowProducer.close());
  if (queueEvents.extract) closeTasks.push(queueEvents.extract.close());
  if (queueEvents.link) closeTasks.push(queueEvents.link.close());
  if (queueEvents.enrich) closeTasks.push(queueEvents.enrich.close());
  if (queueEvents.verify) closeTasks.push(queueEvents.verify.close());
  if (queueEvents.embed) closeTasks.push(queueEvents.embed.close());

  await Promise.all(closeTasks);
}

export async function getQueueStats() {
  if (!extractQueue || !linkQueue || !enrichQueue) {
    return null;
  }

  const [extractCounts, linkCounts, enrichCounts, verifyCounts, embedCounts] =
    await Promise.all([
      extractQueue.getJobCounts(),
      linkQueue.getJobCounts(),
      enrichQueue.getJobCounts(),
      verifyQueue?.getJobCounts(),
      embedQueue?.getJobCounts(),
    ]);

  return {
    extract: extractCounts,
    link: linkCounts,
    enrich: enrichCounts,
    verify: verifyCounts,
    embed: embedCounts,
  };
}
