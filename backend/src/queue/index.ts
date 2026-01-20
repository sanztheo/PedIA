import {
  createExtractWorker,
  closeExtractWorker,
} from "./workers/extractWorker";
import { createLinkWorker, closeLinkWorker } from "./workers/linkWorker";
import { createEnrichWorker, closeEnrichWorker } from "./workers/enrichWorker";
import { createVerifyWorker, closeVerifyWorker } from "./workers/verifyWorker";
import { createEmbedWorker, closeEmbedWorker } from "./workers/embedWorker";
import { closeQueues, getQueueStats } from "./queues";
import type { Worker } from "bullmq";

export * from "./queues";
export { createExtractWorker } from "./workers/extractWorker";
export { createLinkWorker } from "./workers/linkWorker";
export { createEnrichWorker } from "./workers/enrichWorker";
export { createVerifyWorker } from "./workers/verifyWorker";
export { createEmbedWorker } from "./workers/embedWorker";

interface Workers {
  extract: Worker | null;
  link: Worker | null;
  enrich: Worker | null;
  verify: Worker | null;
  embed: Worker | null;
}

let workers: Workers | null = null;

export function startAllWorkers(): Workers {
  if (workers) {
    console.warn("[Queue] Workers already started");
    return workers;
  }

  console.log("[Queue] Starting all workers...");

  workers = {
    extract: createExtractWorker(),
    link: createLinkWorker(),
    enrich: createEnrichWorker(),
    verify: createVerifyWorker(),
    embed: createEmbedWorker(),
  };

  console.log("[Queue] All workers started");

  return workers;
}

export async function stopAllWorkers(): Promise<void> {
  if (!workers) {
    console.warn("[Queue] No workers to stop");
    return;
  }

  console.log("[Queue] Stopping all workers...");

  await Promise.all([
    closeExtractWorker(workers.extract),
    closeLinkWorker(workers.link),
    closeEnrichWorker(workers.enrich),
    closeVerifyWorker(workers.verify),
    closeEmbedWorker(workers.embed),
  ]);

  await closeQueues();

  workers = null;

  console.log("[Queue] All workers stopped");
}

export async function getWorkersHealth() {
  const stats = await getQueueStats();

  return {
    workersRunning: workers !== null,
    queues: stats,
  };
}

process.on("SIGTERM", async () => {
  console.log("[Queue] SIGTERM received, shutting down...");
  await stopAllWorkers();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[Queue] SIGINT received, shutting down...");
  await stopAllWorkers();
  process.exit(0);
});
