import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import prisma from "../lib/prisma";

const app = new Hono();

const createReportSchema = z.object({
  pageId: z.string().uuid(),
  type: z.enum(["INACCURATE", "OUTDATED", "INCOMPLETE", "BIASED", "SPAM", "OTHER"]),
  details: z.string().max(2000).optional(),
});

app.post("/", zValidator("json", createReportSchema), async (c) => {
  const data = c.req.valid("json");

  const page = await prisma.page.findUnique({
    where: { id: data.pageId },
    select: { id: true },
  });

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  const report = await prisma.report.create({
    data: {
      pageId: data.pageId,
      type: data.type,
      details: data.details,
    },
  });

  return c.json({ success: true, reportId: report.id }, 201);
});

app.get("/", async (c) => {
  const statusParam = c.req.query("status");
  const limitParam = c.req.query("limit");

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
  const status = statusParam as "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED" | undefined;

  const reports = await prisma.report.findMany({
    where: status ? { status } : undefined,
    include: {
      page: {
        select: { id: true, slug: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return c.json({ reports, total: reports.length });
});

export default app;
