import { Hono } from "hono";
import { GraphService } from "../services/graph.service";

const app = new Hono();

app.get("/", async (c) => {
  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : 100;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  if (Number.isNaN(limit) || Number.isNaN(offset) || limit < 1 || offset < 0) {
    return c.json({ error: "Invalid pagination parameters" }, 400);
  }

  const result = await GraphService.getFullGraph({
    limit: Math.min(limit, 500),
    offset,
  });

  return c.json(result);
});

app.get("/local/:pageId", async (c) => {
  const pageId = c.req.param("pageId");
  const depthParam = c.req.query("depth");

  const depth = depthParam ? parseInt(depthParam, 10) : 2;

  if (Number.isNaN(depth) || depth < 1 || depth > 5) {
    return c.json({ error: "Invalid depth (must be 1-5)" }, 400);
  }

  const result = await GraphService.getLocalGraph(pageId, depth);
  return c.json(result);
});

app.get("/entity/:entityId", async (c) => {
  const entityId = c.req.param("entityId");

  const result = await GraphService.getEntityRelations(entityId);

  if (!result.entity) {
    return c.json({ error: "Entity not found" }, 404);
  }

  return c.json(result);
});

export default app;
