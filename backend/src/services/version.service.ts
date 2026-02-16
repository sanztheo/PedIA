import prisma from "../lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { PageVersion } from "@prisma/client";

const CHANGELOG_PROMPT = `Compare ces deux versions d'article et génère un résumé en UNE phrase des modifications principales. Réponds uniquement avec la phrase, sans introduction.

Version précédente:
---
{OLD}
---

Nouvelle version:
---
{NEW}
---`;

export const VersionService = {
  async createVersion(pageId: string, content: string, changeLog?: string): Promise<PageVersion | null> {
    // Use transaction to ensure atomicity and prevent race conditions
    try {
      return await prisma.$transaction(async (tx) => {
        // Re-check latest version INSIDE transaction for consistency
        const lastVersion = await tx.pageVersion.findFirst({
          where: { pageId },
          orderBy: { version: "desc" },
          select: { version: true, content: true },
        });

        // Skip if content is identical (deduplication)
        if (lastVersion && lastVersion.content === content) {
          console.log(`[VERSION] Skipping duplicate content for pageId=${pageId}`);
          return null;
        }

        const newVersionNumber = (lastVersion?.version ?? 0) + 1;

        let finalChangeLog = changeLog;
        if (!finalChangeLog && lastVersion) {
          finalChangeLog = await this.generateChangelog(lastVersion.content, content);
        }

        // Create version with unique constraint protection
        return await tx.pageVersion.create({
          data: {
            pageId,
            content,
            version: newVersionNumber,
            changeLog: finalChangeLog || "Version initiale",
          },
        });
      }, {
        isolationLevel: 'Serializable', // Strongest isolation to prevent race conditions
        maxWait: 5000,
        timeout: 10000,
      });
    } catch (error) {
      // Handle unique constraint violation (duplicate version number)
      if ((error as { code?: string }).code === 'P2002') {
        console.warn(`[VERSION] Duplicate version prevented for pageId=${pageId} (race condition detected)`);
        return null;
      }
      
      // Log and rethrow other errors
      console.error('[VERSION] Failed to create version:', error);
      throw error;
    }
  },

  async listVersions(pageId: string): Promise<PageVersion[]> {
    return prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { version: "desc" },
    });
  },

  async getVersion(pageId: string, version: number): Promise<PageVersion | null> {
    return prisma.pageVersion.findUnique({
      where: { pageId_version: { pageId, version } },
    });
  },

  async rollback(pageId: string, toVersion: number): Promise<{ page: unknown; newVersion: PageVersion }> {
    const targetVersion = await this.getVersion(pageId, toVersion);
    if (!targetVersion) {
      throw new Error("Version not found");
    }

    const page = await prisma.page.update({
      where: { id: pageId },
      data: { content: targetVersion.content },
    });

    const newVersion = await this.createVersion(
      pageId,
      targetVersion.content,
      `Restauration vers la version ${toVersion}`
    );

    if (!newVersion) {
      throw new Error("Failed to create rollback version");
    }

    return { page, newVersion };
  },

  async generateChangelog(oldContent: string, newContent: string): Promise<string> {
    try {
      const oldTruncated = oldContent.substring(0, 2000);
      const newTruncated = newContent.substring(0, 2000);

      const prompt = CHANGELOG_PROMPT
        .replace("{OLD}", oldTruncated)
        .replace("{NEW}", newTruncated);

      const result = await generateText({
        model: google("gemini-2.0-flash"),
        prompt,
        maxOutputTokens: 100,
      });

      return result.text.trim() || "Modifications mineures";
    } catch {
      return "Modifications du contenu";
    }
  },
};
