import { serve } from "@hono/node-server";
import { app } from "./app";
import { startAllWorkers, stopAllWorkers } from "./queue";

const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 PedIA Backend running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Start BullMQ workers
console.log("🔄 Starting queue workers...");
const workers = startAllWorkers();

if (workers.extract && workers.link && workers.enrich) {
  console.log("✓ All core workers started successfully");
} else {
  console.warn("⚠ Some workers failed to start (check REDIS_URL)");
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  await stopAllWorkers();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
