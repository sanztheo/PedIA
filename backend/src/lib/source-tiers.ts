export type SourceTier = "TIER_1" | "TIER_2" | "TIER_3" | "UNKNOWN";

interface DomainConfig {
  tier: SourceTier;
  reliability: number;
}

const TIER_1_DOMAINS: string[] = [
  "wikipedia.org",
  "britannica.com",
  "nature.com",
  "sciencedirect.com",
  "pubmed.ncbi.nlm.nih.gov",
  "arxiv.org",
  "reuters.com",
  "apnews.com",
  "bbc.com",
  "nytimes.com",
  "theguardian.com",
  "washingtonpost.com",
  "economist.com",
  "nature.com",
  "science.org",
  "gov",
  "edu",
];

const TIER_2_DOMAINS: string[] = [
  "medium.com",
  "forbes.com",
  "businessinsider.com",
  "techcrunch.com",
  "wired.com",
  "theverge.com",
  "arstechnica.com",
  "cnbc.com",
  "bloomberg.com",
  "ft.com",
  "cnn.com",
  "nbcnews.com",
  "abc.com",
  "cbs.com",
  "npr.org",
];

const BLACKLIST_DOMAINS: string[] = [
  "reddit.com",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "pinterest.com",
  "tumblr.com",
  "quora.com",
  "yahoo.answers.com",
];

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function matchesDomainList(domain: string, list: string[]): boolean {
  return list.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function getSourceTier(url: string): SourceTier {
  const domain = extractDomain(url);

  if (matchesDomainList(domain, BLACKLIST_DOMAINS)) {
    return "UNKNOWN";
  }

  if (matchesDomainList(domain, TIER_1_DOMAINS)) {
    return "TIER_1";
  }

  if (matchesDomainList(domain, TIER_2_DOMAINS)) {
    return "TIER_2";
  }

  return "TIER_3";
}

export function getSourceReliability(url: string): number {
  const tier = getSourceTier(url);

  switch (tier) {
    case "TIER_1":
      return 0.9;
    case "TIER_2":
      return 0.7;
    case "TIER_3":
      return 0.5;
    default:
      return 0.3;
  }
}

export function isSourceAllowed(url: string): boolean {
  const domain = extractDomain(url);
  return !matchesDomainList(domain, BLACKLIST_DOMAINS);
}

export function getDomainConfig(url: string): DomainConfig {
  return {
    tier: getSourceTier(url),
    reliability: getSourceReliability(url),
  };
}

export function filterSourcesByTier(
  urls: string[],
  minTier: SourceTier = "TIER_3"
): string[] {
  const tierOrder: SourceTier[] = ["TIER_1", "TIER_2", "TIER_3", "UNKNOWN"];
  const minIndex = tierOrder.indexOf(minTier);

  return urls.filter((url) => {
    const tier = getSourceTier(url);
    const tierIndex = tierOrder.indexOf(tier);
    return tierIndex <= minIndex && tier !== "UNKNOWN";
  });
}
