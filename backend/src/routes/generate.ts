import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const app = new Hono();

// GET /api/generate?q=... - Generate page with SSE streaming
app.get("/", async (c) => {
  const query = c.req.query("q");

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    // TODO: Implement generation pipeline

    // Step 1: Search
    await stream.writeSSE({
      event: "step",
      data: JSON.stringify({
        type: "step_start",
        step: "search",
        details: "Recherche web...",
      }),
    });

    // Placeholder - will be implemented
    await stream.writeSSE({
      event: "step",
      data: JSON.stringify({ type: "step_complete", step: "search" }),
    });

    await stream.writeSSE({
      event: "complete",
      data: JSON.stringify({
        type: "complete",
        message: "Not fully implemented yet",
      }),
    });
  });
});

export default app;
