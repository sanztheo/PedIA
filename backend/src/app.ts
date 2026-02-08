import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import pages from "./routes/pages";
import generate from "./routes/generate";
import graph from "./routes/graph";
import search from "./routes/search";
import reports from "./routes/reports";
import edit from "./routes/edit";
import admin, { bullBoardApp, adminAuth } from "./routes/admin";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// Routes
app.route("/api/pages", pages);
app.route("/api/generate", generate);
app.route("/api/graph", graph);
app.route("/api/search", search);
app.route("/api/reports", reports);
app.route("/api/edit", edit);

// Admin API routes
app.route("/admin", admin);

// Bull Board dashboard (avec auth)
app.use("/admin/queues/*", adminAuth);
app.route("/admin/queues", bullBoardApp);

export { app };
