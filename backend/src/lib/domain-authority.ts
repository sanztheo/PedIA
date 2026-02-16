/**
 * Domain Authority Score
 * Heuristic-based score (0.0 – 1.0) from URL analysis:
 *   - HTTPS protocol
 *   - Known high-authority domains (Tier 1/2)
 *   - TLD quality (.edu, .gov, .org)
 *   - Known low-quality/spam domains
 */

// ============================================================================
// DOMAIN TIERS
// ============================================================================

const TIER1_DOMAINS = new Set([
  // Reference / encyclopedic
  "wikipedia.org", "britannica.com", "scholarpedia.org",
  // Science & academic
  "nature.com", "science.org", "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov",
  "arxiv.org", "scholar.google.com", "jstor.org", "semanticscholar.org",
  "researchgate.net", "biorxiv.org", "medrxiv.org",
  // Quality press
  "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com", "afp.com",
  "lemonde.fr", "liberation.fr", "lefigaro.fr", "lesechos.fr",
  "nytimes.com", "washingtonpost.com", "theguardian.com", "economist.com",
  "ft.com", "wsj.com",
  // Official / government
  "who.int", "un.org", "europa.eu", "gouvernement.fr", "elysee.fr",
  "assemblee-nationale.fr", "senat.fr",
]);

const TIER2_DOMAINS = new Set([
  "forbes.com", "time.com", "bloomberg.com", "businessinsider.com",
  "techcrunch.com", "wired.com", "arstechnica.com", "theverge.com",
  "nationalgeographic.com", "smithsonianmag.com", "scientificamerican.com",
  "francetvinfo.fr", "leparisien.fr", "20minutes.fr", "ouest-france.fr",
  "huffingtonpost.fr", "slate.fr", "mediapart.fr",
  "medium.com", "substack.com",
]);

const BLACKLISTED_DOMAINS = new Set([
  "rt.com", "sputniknews.com", "infowars.com", "breitbart.com",
  "dailymail.co.uk",
]);

// ============================================================================
// SCORING
// ============================================================================

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isHttps(url: string): boolean {
  return url.startsWith("https://");
}

/**
 * Returns a reliability score between 0.0 and 1.0.
 *
 * Breakdown:
 *   Tier 1 domain / .gov / .edu  → 0.95 (HTTPS) or 0.85
 *   Tier 2 domain                → 0.78 (HTTPS) or 0.68
 *   Blacklisted                  → 0.10
 *   Unknown .org                 → 0.70 (HTTPS) or 0.60
 *   Unknown other                → 0.65 (HTTPS) or 0.50
 *
 * Result is always clamped to [0.0, 1.0].
 */
export function computeDomainAuthority(url: string): number {
  const domain = extractDomain(url);
  if (!domain) return 0.3;

  const https = isHttps(url);

  // Blacklisted
  if (BLACKLISTED_DOMAINS.has(domain)) return 0.10;

  // Check tiers (also check parent domain for subdomains)
  const domainParts = domain.split(".");
  const parentDomain =
    domainParts.length > 2 ? domainParts.slice(-2).join(".") : domain;

  if (TIER1_DOMAINS.has(domain) || TIER1_DOMAINS.has(parentDomain)) {
    return https ? 0.95 : 0.85;
  }

  if (TIER2_DOMAINS.has(domain) || TIER2_DOMAINS.has(parentDomain)) {
    return https ? 0.78 : 0.68;
  }

  // Per doc: .gov and .edu are Tier 1 (Haute Confiance / Auto-accept)
  if (domain.endsWith(".gov") || domain.endsWith(".edu")) {
    return https ? 0.95 : 0.85;
  }

  // .org gets a moderate boost
  if (domain.endsWith(".org")) {
    return https ? 0.70 : 0.60;
  }

  // Unknown domain
  return https ? 0.65 : 0.50;
}
