import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import prisma from "../lib/prisma";
import {
  parseMarkdownSections,
  editSection,
  insertAfterSection,
  appendToSection,
  deleteSection,
} from "../lib/markdown-editor";

const app = new Hono();

const editSectionSchema = z.object({
  sectionId: z.string(),
  newContent: z.string(),
  reason: z.string().optional(),
});

const insertAfterSchema = z.object({
  afterSectionId: z.string(),
  content: z.string(),
  reason: z.string().optional(),
});

const appendSchema = z.object({
  sectionId: z.string(),
  content: z.string(),
  reason: z.string().optional(),
});

const deleteSectionSchema = z.object({
  sectionId: z.string(),
  reason: z.string(),
});

app.get("/:pageId/sections", async (c) => {
  const pageId = c.req.param("pageId");

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: { content: true },
  });

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  const sections = parseMarkdownSections(page.content);
  return c.json({ sections });
});

app.post(
  "/:pageId/edit",
  zValidator("json", editSectionSchema),
  async (c) => {
    const pageId = c.req.param("pageId");
    const { sectionId, newContent, reason: _reason } = c.req.valid("json");

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, content: true },
    });

    if (!page) {
      return c.json({ error: "Page not found" }, 404);
    }

    const result = editSection(page.content, sectionId, newContent);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    await prisma.page.update({
      where: { id: pageId },
      data: { content: result.content },
    });

    return c.json({ success: true, changedSection: result.changedSection });
  }
);

app.post(
  "/:pageId/insert",
  zValidator("json", insertAfterSchema),
  async (c) => {
    const pageId = c.req.param("pageId");
    const { afterSectionId, content, reason: _reason } = c.req.valid("json");

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, content: true },
    });

    if (!page) {
      return c.json({ error: "Page not found" }, 404);
    }

    const result = insertAfterSection(page.content, afterSectionId, content);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    await prisma.page.update({
      where: { id: pageId },
      data: { content: result.content },
    });

    return c.json({ success: true, changedSection: result.changedSection });
  }
);

app.post(
  "/:pageId/append",
  zValidator("json", appendSchema),
  async (c) => {
    const pageId = c.req.param("pageId");
    const { sectionId, content, reason: _reason } = c.req.valid("json");

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, content: true },
    });

    if (!page) {
      return c.json({ error: "Page not found" }, 404);
    }

    const result = appendToSection(page.content, sectionId, content);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    await prisma.page.update({
      where: { id: pageId },
      data: { content: result.content },
    });

    return c.json({ success: true, changedSection: result.changedSection });
  }
);

app.delete(
  "/:pageId/section",
  zValidator("json", deleteSectionSchema),
  async (c) => {
    const pageId = c.req.param("pageId");
    const { sectionId, reason: _reason } = c.req.valid("json");

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, content: true },
    });

    if (!page) {
      return c.json({ error: "Page not found" }, 404);
    }

    const result = deleteSection(page.content, sectionId);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    await prisma.page.update({
      where: { id: pageId },
      data: { content: result.content },
    });

    return c.json({ success: true, deletedSection: sectionId });
  }
);

export default app;
