import { Hono } from "hono";
import { VersionService } from "../services/version.service";

const app = new Hono();

app.get("/:pageId/versions", async (c) => {
  const pageId = c.req.param("pageId");
  const versions = await VersionService.listVersions(pageId);
  return c.json(versions);
});

app.get("/:pageId/versions/:version", async (c) => {
  const pageId = c.req.param("pageId");
  const version = parseInt(c.req.param("version"), 10);

  if (Number.isNaN(version)) {
    return c.json({ error: "Invalid version number" }, 400);
  }

  const pageVersion = await VersionService.getVersion(pageId, version);
  if (!pageVersion) {
    return c.json({ error: "Version not found" }, 404);
  }

  return c.json(pageVersion);
});

app.post("/:pageId/versions/:version/rollback", async (c) => {
  const pageId = c.req.param("pageId");
  const version = parseInt(c.req.param("version"), 10);

  if (Number.isNaN(version)) {
    return c.json({ error: "Invalid version number" }, 400);
  }

  try {
    const result = await VersionService.rollback(pageId, version);
    return c.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Version not found") {
      return c.json({ error: "Version not found" }, 404);
    }
    throw error;
  }
});

export default app;
