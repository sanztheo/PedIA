import {
  createExtractWorker,
  closeExtractWorker,
} from "./workers/extractWorker";
import { createLinkWorker, closeLinkWorker } from "./workers/linkWorker";
import { createEnrichWorker, closeEnrichWorker } from "./workers/enrichWorker";
import { closeQueues, getQueueStats } from "./queues";
import type { Worker } from "bullmq";

export * from "./queues";
export { createExtractWorker } from "./workers/extractWorker";
export { createLinkWorker } from "./workers/linkWorker";
export { createEnrichWorker } from "./workers/enrichWorker";

interface Workers {
  extract: Worker | null;
  link: Worker | null;
  enrich: Worker | null;
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
