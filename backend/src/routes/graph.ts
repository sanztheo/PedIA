import { Hono } from "hono";

const app = new Hono();

// GET /api/graph - Get full graph (paginated)
app.get("/", async (c) => {
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");

  // TODO: Implement graph retrieval
  return c.json({ nodes: [], links: [], total: 0 });
});

// GET /api/graph/local/:pageId - Get local graph around a page
app.get("/local/:pageId", async (c) => {
  const pageId = c.req.param("pageId");
  const depth = parseInt(c.req.query("depth") || "2");

  // TODO: Implement local graph retrieval
  return c.json({ nodes: [], links: [] });
});

// GET /api/graph/entity/:entityId - Get entity relationships
app.get("/entity/:entityId", async (c) => {
  const entityId = c.req.param("entityId");

  // TODO: Implement entity relations retrieval
  return c.json({ entity: null, relations: [] });
});

export default app;
