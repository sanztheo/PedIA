import { Hono } from "hono";

const app = new Hono();

// GET /api/search?q=... - Search pages
app.get("/", async (c) => {
  const query = c.req.query("q");

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  // TODO: Implement search (Qdrant + PostgreSQL)
  return c.json({ results: [], total: 0 });
});

export default app;
