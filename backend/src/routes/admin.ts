import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { extractQueue, linkQueue, enrichQueue } from "../queue/queues";
import adminVersions from "./admin-versions";

// Basic Auth middleware
const adminSecret = process.env.ADMIN_SECRET || "admin";
const auth = basicAuth({
  username: "admin",
  password: adminSecret,
});

// Setup Bull Board
const serverAdapter = new HonoAdapter(serveStatic);
serverAdapter.setBasePath("/admin/queues");

// Collecter les queues disponibles
const queues: BullMQAdapter[] = [];
if (extractQueue) queues.push(new BullMQAdapter(extractQueue));
if (linkQueue) queues.push(new BullMQAdapter(linkQueue));
if (enrichQueue) queues.push(new BullMQAdapter(enrichQueue));

if (queues.length > 0) {
  createBullBoard({
    queues,
    serverAdapter,
  });
}

// Export Bull Board app pour montage direct
export const bullBoardApp = serverAdapter.registerPlugin();

// Admin API routes
const admin = new Hono();

admin.get("/status", auth, async (c) => {
  if (!extractQueue || !linkQueue || !enrichQueue) {
    return c.json({ error: "Queues not available (REDIS_URL not set)" }, 503);
  }

  const [extractCounts, linkCounts, enrichCounts] = await Promise.all([
    extractQueue.getJobCounts(),
    linkQueue.getJobCounts(),
    enrichQueue.getJobCounts(),
  ]);

  return c.json({
    queues: {
      extract: extractCounts,
      link: linkCounts,
      enrich: enrichCounts,
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount version admin routes
admin.route("/", adminVersions);

export default admin;
export { auth as adminAuth };
