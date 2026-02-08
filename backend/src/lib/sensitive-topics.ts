/**
 * Sensitive Topics Detection
 * Flags content that requires multi-source verification
 */

export type SensitiveCategory =
  | "POLITICS"
  | "RELIGION"
  | "HEALTH"
  | "HISTORY"
  | "CONTROVERSY"
  | "LEGAL";

interface SensitiveTopic {
  category: SensitiveCategory;
  keywords: string[];
  requireMultiSource: boolean;
  minSources: number;
}

const SENSITIVE_TOPICS: SensitiveTopic[] = [
  {
    category: "POLITICS",
    keywords: [
      "election",
      "president",
      "parti politique",
      "gouvernement",
      "ministre",
      "vote",
      "referendum",
      "gauche",
      "droite",
      "liberal",
      "conservateur",
      "democrate",
      "republicain",
      "political party",
      "government",
      "congress",
      "parliament",
    ],
    requireMultiSource: true,
    minSources: 3,
  },
  {
    category: "RELIGION",
    keywords: [
      "religion",
      "dieu",
      "eglise",
      "mosquee",
      "synagogue",
      "temple",
      "foi",
      "croyance",
      "athee",
      "islam",
      "christianisme",
      "judaisme",
      "bouddhisme",
      "hindouisme",
      "god",
      "church",
      "faith",
      "belief",
    ],
    requireMultiSource: true,
    minSources: 3,
  },
  {
    category: "HEALTH",
    keywords: [
      "traitement",
      "medicament",
      "maladie",
      "vaccin",
      "cancer",
      "diabete",
      "diagnostic",
      "symptome",
      "therapie",
      "guerison",
      "treatment",
      "medicine",
      "disease",
      "vaccine",
      "diagnosis",
      "therapy",
      "cure",
    ],
    requireMultiSource: true,
    minSources: 2,
  },
  {
    category: "HISTORY",
    keywords: [
      "genocide",
      "holocauste",
      "guerre mondiale",
      "esclavage",
      "colonisation",
      "massacre",
      "world war",
      "holocaust",
      "slavery",
      "colonization",
    ],
    requireMultiSource: true,
    minSources: 3,
  },
  {
    category: "CONTROVERSY",
    keywords: [
      "controverse",
      "scandale",
      "accusation",
      "allegation",
      "polemique",
      "debat",
      "controversy",
      "scandal",
      "allegation",
      "dispute",
    ],
    requireMultiSource: true,
    minSources: 2,
  },
  {
    category: "LEGAL",
    keywords: [
      "proces",
      "tribunal",
      "condamnation",
      "verdict",
      "criminel",
      "prison",
      "trial",
      "court",
      "conviction",
      "criminal",
      "lawsuit",
    ],
    requireMultiSource: true,
    minSources: 2,
  },
];

export interface SensitiveAnalysisResult {
  isSensitive: boolean;
  categories: SensitiveCategory[];
  matchedKeywords: string[];
  requiredSources: number;
  recommendation: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function analyzeSensitiveTopics(
  content: string
): SensitiveAnalysisResult {
  const normalized = normalizeText(content);
  const matchedCategories: Set<SensitiveCategory> = new Set();
  const matchedKeywords: string[] = [];
  let maxRequiredSources = 1;

  for (const topic of SENSITIVE_TOPICS) {
    for (const keyword of topic.keywords) {
      if (normalized.includes(normalizeText(keyword))) {
        matchedCategories.add(topic.category);
        matchedKeywords.push(keyword);
        if (topic.requireMultiSource) {
          maxRequiredSources = Math.max(maxRequiredSources, topic.minSources);
        }
      }
    }
  }

  const categories = Array.from(matchedCategories);
  const isSensitive = categories.length > 0;

  let recommendation = "Standard verification sufficient";
  if (isSensitive) {
    recommendation = `Sensitive content detected. Require ${maxRequiredSources}+ independent sources for verification.`;
  }

  return {
    isSensitive,
    categories,
    matchedKeywords: [...new Set(matchedKeywords)],
    requiredSources: maxRequiredSources,
    recommendation,
  };
}

export function getSensitivityLevel(
  result: SensitiveAnalysisResult
): "none" | "low" | "medium" | "high" {
  if (!result.isSensitive) return "none";
  if (result.categories.length === 1) return "low";
  if (result.categories.length <= 2) return "medium";
  return "high";
}
