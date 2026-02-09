import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { generatePage, type SSEEmitter } from "../ai/agent";
import prisma from "../lib/prisma";
import { setCache, invalidateGraphCache } from "../lib/redis";
import type { SSEEventType } from "../types";

const app = new Hono();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

function titleFromQuery(query: string): string {
  return query.charAt(0).toUpperCase() + query.slice(1);
}

app.get("/", async (c) => {
  const query = c.req.query("q");

  if (!query || query.trim().length === 0) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  if (query.length > 500) {
    return c.json({ error: "Query too long (max 500 characters)" }, 400);
  }

  const slug = slugify(query);

  const existingPage = await prisma.page.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, status: true },
  });

  if (existingPage && existingPage.status === "PUBLISHED") {
    return c.json({
      type: "existing",
      page: {
        id: existingPage.id,
        slug: existingPage.slug,
        title: existingPage.title,
      },
    });
  }

  return streamSSE(c, async (stream) => {
    const sendEvent = async (
      event: string,
      type: SSEEventType,
      data: Record<string, unknown>,
    ) => {
      await stream.writeSSE({
        event,
        data: JSON.stringify({ type, ...data }),
      });
    };

    const emitter: SSEEmitter = {
      stepStart: async (step: string, details?: string) => {
        await sendEvent("step", "step_start", { step, details });
      },
      stepComplete: async (step: string) => {
        await sendEvent("step", "step_complete", { step });
      },
      stepError: async (step: string, error: string) => {
        await sendEvent("step", "step_error", {
          step,
          error,
          recoverable: true,
        });
      },
      contentChunk: async (content: string) => {
        await sendEvent("content", "content_chunk", { content });
      },
      entityFound: async (entity: { name: string; type: string }) => {
        await sendEvent("entity", "entity_found", { entity });
      },
      complete: async (page: { id: string; slug: string; title: string }) => {
        await sendEvent("complete", "complete", { page });
      },
      error: async (message: string) => {
        await sendEvent("error", "error", { message });
      },
    };

    try {
      const { content, entities, sources } = await generatePage(
        { query, provider: "google" },
        emitter,
      );

      await emitter.stepStart("save", "Sauvegarde...");

      const title = titleFromQuery(query);

      // Use transaction to ensure atomicity of page + entities + sources save
      const page = await prisma.$transaction(async (tx) => {
        // Create or update the page
        const savedPage = await tx.page.upsert({
          where: { slug },
          create: {
            slug,
            title,
            content,
            status: "PUBLISHED",
          },
          update: {
            content,
            status: "PUBLISHED",
            updatedAt: new Date(),
          },
        });

        // Save all entities within the same transaction
        for (const entity of entities) {
          const normalizedName = entity.name.toLowerCase().trim();

          const dbEntity = await tx.entity.upsert({
            where: { normalizedName },
            create: {
              name: entity.name,
              normalizedName,
              type: entity.type,
            },
            update: {},
          });

          await tx.pageEntity.upsert({
            where: {
              pageId_entityId: {
                pageId: savedPage.id,
                entityId: dbEntity.id,
              },
            },
            create: {
              pageId: savedPage.id,
              entityId: dbEntity.id,
              relevance: entity.relevance,
            },
            update: {
              relevance: entity.relevance,
            },
          });
        }

        // Save sources
        for (const source of sources) {
          const dbSource = await tx.source.upsert({
            where: { url: source.url },
            create: {
              url: source.url,
              title: source.title,
              domain: source.domain,
            },
            update: {
              title: source.title,
            },
          });

          await tx.pageSource.upsert({
            where: {
              pageId_sourceId: {
                pageId: savedPage.id,
                sourceId: dbSource.id,
              },
            },
            create: {
              pageId: savedPage.id,
              sourceId: dbSource.id,
            },
            update: {},
          });
        }

        return savedPage;
      }, { timeout: 40000 });

      // Cache outside transaction (non-critical, fire and forget)
      setCache(`page:${slug}`, page, 3600).catch((err) => {
        console.error("Failed to cache page:", err);
      });
      invalidateGraphCache().catch(() => {});

      await emitter.stepComplete("save");

      await emitter.complete({
        id: page.id,
        slug: page.slug,
        title: page.title,
      });
    } catch (error) {
      console.error("Generation error:", error);
      await emitter.error(
        error instanceof Error ? error.message : "Une erreur est survenue",
      );
    }
  });
});

export default app;
