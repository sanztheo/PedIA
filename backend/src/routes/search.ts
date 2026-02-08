import { Hono } from "hono";
import prisma from "../lib/prisma";
import { getCache, setCache } from "../lib/redis";
import { embeddingService } from "../services/embedding.service";
import type { SearchResult } from "../types";

const app = new Hono();
const SEARCH_CACHE_TTL = 900;
const SEMANTIC_WEIGHT = 0.6;
const FULLTEXT_WEIGHT = 0.4;

app.get("/", async (c) => {
  const query = c.req.query("q");
  const limitParam = c.req.query("limit");
  const mode = c.req.query("mode") || "hybrid";

  if (!query || query.trim().length === 0) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  const searchTerm = query.trim();

  if (searchTerm.length > 200) {
    return c.json({ error: "Query too long (max 200 characters)" }, 400);
  }

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

  if (Number.isNaN(limit) || limit < 1) {
    return c.json({ error: "Invalid limit parameter" }, 400);
  }

  const cacheKey = `search:${mode}:${searchTerm.toLowerCase()}:${limit}`;
  const cached = await getCache<{ results: SearchResult[]; total: number }>(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  const resultMap = new Map<string, SearchResult>();

  if (mode === "hybrid" || mode === "semantic") {
    try {
      const semanticResults = await embeddingService.searchSimilar(searchTerm, limit * 2);
      const pageIds = [...new Set(semanticResults.map(r => r.pageId))];
      
      if (pageIds.length > 0) {
        const pages = await prisma.page.findMany({
          where: { id: { in: pageIds }, status: "PUBLISHED" },
          select: { id: true, slug: true, title: true, summary: true },
        });

        const pageMap = new Map(pages.map(p => [p.id, p]));
        
        for (const result of semanticResults) {
          const page = pageMap.get(result.pageId);
          if (page && !resultMap.has(page.id)) {
            resultMap.set(page.id, {
              id: page.id,
              slug: page.slug,
              title: page.title,
              summary: page.summary,
              score: result.similarity * SEMANTIC_WEIGHT,
            });
          }
        }
      }
    } catch {
      // Semantic search failed, fall back to full-text only
    }
  }

  if (mode === "hybrid" || mode === "fulltext") {
    const [pages, entities] = await Promise.all([
      prisma.page.findMany({
        where: {
          status: "PUBLISHED",
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { content: { contains: searchTerm, mode: "insensitive" } },
            { summary: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, slug: true, title: true, summary: true },
        take: limit,
        orderBy: { viewCount: "desc" },
      }),
      prisma.entity.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, type: true, description: true },
        take: Math.floor(limit / 2),
      }),
    ]);

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const existing = resultMap.get(p.id);
      const fulltextScore = Math.max(0.1, 1 - i * 0.05) * FULLTEXT_WEIGHT;
      
      if (existing) {
        existing.score += fulltextScore;
      } else {
        resultMap.set(p.id, {
          id: p.id,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          score: fulltextScore,
        });
      }
    }

    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      const slug = e.name.toLowerCase().replace(/\s+/g, "-");
      if (!resultMap.has(e.id)) {
        resultMap.set(e.id, {
          id: e.id,
          slug,
          title: e.name,
          summary: e.description || `${e.type}`,
          score: Math.max(0.1, 0.8 - i * 0.05) * FULLTEXT_WEIGHT,
        });
      }
    }
  }

  const results = Array.from(resultMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const response = { results, total: results.length };
  await setCache(cacheKey, response, SEARCH_CACHE_TTL);

  return c.json(response);
});

export default app;
