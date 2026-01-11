import { serve } from "@hono/node-server";
import { app } from "./app";

const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 PedIA Backend running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
