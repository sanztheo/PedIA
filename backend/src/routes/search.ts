import { Hono } from "hono";
import prisma from "../lib/prisma";
import { getCache, setCache } from "../lib/redis";
import type { SearchResult } from "../types";

const app = new Hono();
const SEARCH_CACHE_TTL = 900;

app.get("/", async (c) => {
  const query = c.req.query("q");
  const limitParam = c.req.query("limit");

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

  const cacheKey = `search:${searchTerm.toLowerCase()}:${limit}`;
  const cached = await getCache<{ results: SearchResult[]; total: number }>(cacheKey);
  if (cached) {
    return c.json(cached);
  }

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
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
      },
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
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      take: Math.floor(limit / 2),
    }),
  ]);

  const pageResults: SearchResult[] = pages.map((p, i) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    score: Math.max(0.1, 1 - i * 0.05),
  }));

  const entityResults: SearchResult[] = entities.map((e, i) => ({
    id: e.id,
    slug: e.name.toLowerCase().replace(/\s+/g, "-"),
    title: e.name,
    summary: e.description || `${e.type}`,
    score: Math.max(0.1, 0.8 - i * 0.05),
  }));

  const results = [...pageResults, ...entityResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const response = {
    results,
    total: results.length,
  };

  await setCache(cacheKey, response, SEARCH_CACHE_TTL);

  return c.json(response);
});

export default app;
