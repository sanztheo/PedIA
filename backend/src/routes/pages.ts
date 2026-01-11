import { Hono } from "hono";

const app = new Hono();

// GET /api/pages - List all pages
app.get("/", async (c) => {
  // TODO: Implement page listing
  return c.json({ pages: [], total: 0 });
});

// GET /api/pages/:slug - Get page by slug
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  // TODO: Implement page retrieval
  return c.json({ error: "Not implemented" }, 501);
});

// POST /api/pages - Create page (admin)
app.post("/", async (c) => {
  // TODO: Implement page creation
  return c.json({ error: "Not implemented" }, 501);
});

export default app;
