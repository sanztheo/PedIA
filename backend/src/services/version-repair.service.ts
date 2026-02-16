import prisma from "../lib/prisma";

/**
 * Auto-repair service to ensure all pages have at least one version
 * Runs periodically to fix any pages missing versions
 */
export const VersionRepairService = {
  /**
   * Check all pages and create missing initial versions
   * @returns Number of pages repaired
   */
  async repairMissingVersions(): Promise<number> {
    console.log('[VERSION_REPAIR] Starting repair scan...');

    // Find all pages without any versions
    const pagesWithoutVersions = await prisma.page.findMany({
      where: {
        versions: {
          none: {},
        },
      },
      select: {
        id: true,
        slug: true,
        content: true,
        createdAt: true,
      },
    });

    if (pagesWithoutVersions.length === 0) {
      console.log('[VERSION_REPAIR] No pages need repair');
      return 0;
    }

    console.log(`[VERSION_REPAIR] Found ${pagesWithoutVersions.length} pages without versions`);

    let repaired = 0;

    for (const page of pagesWithoutVersions) {
      try {
        await prisma.pageVersion.create({
          data: {
            pageId: page.id,
            content: page.content,
            version: 1,
            changeLog: "Version initiale (auto-repair)",
            createdAt: page.createdAt, // Preserve original creation date
          },
        });

        console.log(`[VERSION_REPAIR] Repaired page: ${page.slug}`);
        repaired++;
      } catch (error) {
        console.error(`[VERSION_REPAIR] Failed to repair page ${page.slug}:`, error);
      }
    }

    console.log(`[VERSION_REPAIR] Repair complete: ${repaired} pages fixed`);
    return repaired;
  },

  /**
   * Detect and fix duplicate version numbers for a page
   * @param pageId Page to check
   * @returns Number of duplicates fixed
   */
  async fixDuplicateVersions(pageId: string): Promise<number> {
    const versions = await prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: 'asc' }, // Order by creation date
    });

    // Group by version number to find duplicates
    const versionGroups = new Map<number, typeof versions>();
    for (const v of versions) {
      if (!versionGroups.has(v.version)) {
        versionGroups.set(v.version, []);
      }
      versionGroups.get(v.version)!.push(v);
    }

    let fixed = 0;

    // Fix duplicates by renumbering
    for (const [versionNum, group] of versionGroups) {
      if (group.length > 1) {
        console.warn(`[VERSION_REPAIR] Found ${group.length} duplicates for version ${versionNum} on pageId=${pageId}`);

        // Keep the oldest one, renumber the others
        for (let i = 1; i < group.length; i++) {
          const newVersionNum = Math.max(...Array.from(versionGroups.keys())) + 1;
          await prisma.pageVersion.update({
            where: { id: group[i].id },
            data: { version: newVersionNum },
          });
          console.log(`[VERSION_REPAIR] Renumbered duplicate version ${versionNum} → ${newVersionNum}`);
          fixed++;
        }
      }
    }

    return fixed;
  },

  /**
   * Verify version integrity for a specific page
   * - Checks for missing versions
   * - Checks for duplicate version numbers
   * - Returns report of issues found
   */
  async verifyPageVersions(pageId: string): Promise<{
    hasVersions: boolean;
    hasDuplicates: boolean;
    versionCount: number;
    issues: string[];
  }> {
    const versions = await prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { version: 'asc' },
      select: { version: true, createdAt: true },
    });

    const issues: string[] = [];
    const hasVersions = versions.length > 0;
    
    if (!hasVersions) {
      issues.push('Page has no versions');
    }

    // Check for duplicates
    const versionNumbers = versions.map(v => v.version);
    const uniqueVersions = new Set(versionNumbers);
    const hasDuplicates = versionNumbers.length !== uniqueVersions.size;

    if (hasDuplicates) {
      issues.push('Duplicate version numbers detected');
    }

    // Check for gaps in version sequence
    for (let i = 1; i < versions.length; i++) {
      if (versions[i].version !== versions[i - 1].version + 1) {
        issues.push(`Version gap: ${versions[i - 1].version} → ${versions[i].version}`);
      }
    }

    return {
      hasVersions,
      hasDuplicates,
      versionCount: versions.length,
      issues,
    };
  },
};
