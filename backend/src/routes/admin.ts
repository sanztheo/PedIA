import { Hono } from "hono";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { extractQueue, linkQueue, enrichQueue } from "../queue/queues";

const admin = new Hono();

// Middleware d'authentification pour /admin/*
const authMiddleware = async (
  c: { req: { header: (name: string) => string | undefined; query: (name: string) => string | undefined }; json: (body: unknown, status?: number) => Response },
  next: () => Promise<void>
) => {
  const adminSecret = process.env.ADMIN_SECRET;

  // Si pas de secret configuré, bloquer l'accès
  if (!adminSecret) {
    return c.json({ error: "ADMIN_SECRET not configured" }, 500);
  }

  // Vérifier le header ou query param
  const providedSecret =
    c.req.header("x-admin-secret") || c.req.query("secret");

  if (providedSecret !== adminSecret) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};

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

// Route Bull Board UI (avec auth)
const bullBoardApp = serverAdapter.registerPlugin();
admin.use("/queues/*", authMiddleware);
admin.route("/queues", bullBoardApp);

// Route statut des queues (API simple avec auth)
admin.get("/status", authMiddleware, async (c) => {
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

export default admin;
