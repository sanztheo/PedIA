import { Hono } from "hono";
import { VersionRepairService } from "../services/version-repair.service";

const app = new Hono();

/**
 * Repair all pages missing versions
 * GET /api/admin/version-repair
 */
app.get("/version-repair", async (c) => {
  try {
    const repaired = await VersionRepairService.repairMissingVersions();
    return c.json({
      success: true,
      repaired,
      message: `Repaired ${repaired} pages`,
    });
  } catch (error) {
    console.error("[ADMIN] Version repair failed:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Version repair failed",
      },
      500
    );
  }
});

/**
 * Verify versions for a specific page
 * GET /api/admin/version-verify/:pageId
 */
app.get("/version-verify/:pageId", async (c) => {
  const pageId = c.req.param("pageId");

  try {
    const report = await VersionRepairService.verifyPageVersions(pageId);
    return c.json({
      success: true,
      ...report,
    });
  } catch (error) {
    console.error("[ADMIN] Version verification failed:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      500
    );
  }
});

/**
 * Fix duplicate versions for a specific page
 * POST /api/admin/version-fix-duplicates/:pageId
 */
app.post("/version-fix-duplicates/:pageId", async (c) => {
  const pageId = c.req.param("pageId");

  try {
    const fixed = await VersionRepairService.fixDuplicateVersions(pageId);
    return c.json({
      success: true,
      fixed,
      message: `Fixed ${fixed} duplicate versions`,
    });
  } catch (error) {
    console.error("[ADMIN] Duplicate fix failed:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Fix failed",
      },
      500
    );
  }
});

export default app;
