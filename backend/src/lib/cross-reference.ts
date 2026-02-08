import prisma from "./prisma";

interface CrossReferenceResult {
  claim: string;
  verified: boolean;
  sourceCount: number;
  sources: string[];
  confidence: number;
}

export async function verifyClaim(
  pageId: string,
  claim: string
): Promise<CrossReferenceResult> {
  const pageSources = await prisma.pageSource.findMany({
    where: { pageId },
    include: {
      source: {
        select: { url: true, content: true, reliability: true },
      },
    },
  });

  const matchingSources: string[] = [];
  const claimLower = claim.toLowerCase();

  for (const ps of pageSources) {
    if (ps.source.content?.toLowerCase().includes(claimLower)) {
      matchingSources.push(ps.source.url);
    }
  }

  const verified = matchingSources.length >= 2;
  const avgReliability =
    matchingSources.length > 0
      ? pageSources
          .filter((ps) => matchingSources.includes(ps.source.url))
          .reduce((sum, ps) => sum + ps.source.reliability, 0) /
        matchingSources.length
      : 0;

  return {
    claim,
    verified,
    sourceCount: matchingSources.length,
    sources: matchingSources,
    confidence: verified ? avgReliability : avgReliability * 0.5,
  };
}

export async function getPageSourceStats(pageId: string) {
  const sources = await prisma.pageSource.findMany({
    where: { pageId },
    include: {
      source: {
        select: { url: true, domain: true, reliability: true },
      },
    },
  });

  const tier1Count = sources.filter((s) => s.source.reliability >= 0.8).length;
  const tier2Count = sources.filter(
    (s) => s.source.reliability >= 0.6 && s.source.reliability < 0.8
  ).length;
  const tier3Count = sources.filter((s) => s.source.reliability < 0.6).length;

  const avgReliability =
    sources.length > 0
      ? sources.reduce((sum, s) => sum + s.source.reliability, 0) /
        sources.length
      : 0;

  return {
    totalSources: sources.length,
    tier1Count,
    tier2Count,
    tier3Count,
    avgReliability,
    crossReferenced: sources.length >= 2,
  };
}
