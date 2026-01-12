import { Hono } from "hono";
import { PageService } from "../services/page.service";
import type { PageStatus } from "@prisma/client";

const app = new Hono();

const VALID_STATUSES: PageStatus[] = ["DRAFT", "GENERATING", "PUBLISHED", "ERROR"];

function isValidStatus(status: string | undefined): status is PageStatus {
  return status !== undefined && VALID_STATUSES.includes(status as PageStatus);
}

app.get("/", async (c) => {
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");
  const statusParam = c.req.query("status");

  const status = isValidStatus(statusParam) ? statusParam : undefined;

  const limit = limitParam ? parseInt(limitParam, 10) : 20;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  if (Number.isNaN(limit) || Number.isNaN(offset) || limit < 1 || offset < 0) {
    return c.json({ error: "Invalid pagination parameters" }, 400);
  }

  const result = await PageService.list({
    limit: Math.min(limit, 100),
    offset,
    status,
  });

  return c.json(result);
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const withEntities = c.req.query("entities") === "true";

  const page = withEntities
    ? await PageService.getBySlugWithEntities(slug)
    : await PageService.getBySlug(slug);

  if (!page) {
    return c.json({ error: "Page not found" }, 404);
  }

  if (page.id) {
    PageService.incrementViewCount(page.id).catch(() => {});
  }

  return c.json(page);
});

app.post("/", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (
    typeof body.slug !== "string" ||
    typeof body.title !== "string" ||
    typeof body.content !== "string" ||
    !body.slug.trim() ||
    !body.title.trim()
  ) {
    return c.json({ error: "Missing or invalid required fields: slug, title, content (must be non-empty strings)" }, 400);
  }

  try {
    const page = await PageService.create({
      slug: body.slug as string,
      title: body.title as string,
      content: body.content as string,
      summary: body.summary as string | undefined,
      status: isValidStatus(body.status as string) ? (body.status as PageStatus) : undefined,
    });

    return c.json(page, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return c.json({ error: "Page with this slug already exists" }, 409);
    }
    throw error;
  }
});

app.patch("/:id", async (c) => {
  const id = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  try {
    const page = await PageService.update(id, {
      title: body.title as string | undefined,
      content: body.content as string | undefined,
      summary: body.summary as string | undefined,
      status: isValidStatus(body.status as string) ? (body.status as PageStatus) : undefined,
    });

    return c.json(page);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return c.json({ error: "Page not found" }, 404);
    }
    throw error;
  }
});

app.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    await PageService.delete(id);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return c.json({ error: "Page not found" }, 404);
    }
    throw error;
  }
});

export default app;
