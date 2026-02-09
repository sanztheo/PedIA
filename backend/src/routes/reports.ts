import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import prisma from "../lib/prisma";

const app = new Hono();

const reportSchema = z.object({
  pageId: z.string().uuid(),
  reason: z.enum([
    "INACCURATE",
    "BIAS",
    "OUTDATED",
    "MISSING_SOURCE",
    "OFFENSIVE",
    "OTHER",
  ]),
  details: z.string().max(2000).optional(),
});

// Create report
app.post("/", zValidator("json", reportSchema), async (c) => {
  const { pageId, reason, details } = c.req.valid("json");

  // Verify page exists
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { id: true },
  });

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  // For now, just log the report (in production, save to DB or send to moderation queue)
  console.log(`[REPORT] Page ${pageId}: ${reason}`, details || "");

  // TODO: Store in a Report model when added to schema
  // await prisma.report.create({
  //   data: { pageId, reason, details, status: 'PENDING' }
  // });

  return c.json({ success: true, message: "Report submitted" });
});

// Get reports (admin only - basic implementation)
app.get("/", async (c) => {
  // TODO: Add authentication and return stored reports
  return c.json({ reports: [], total: 0 });
});

export default app;
