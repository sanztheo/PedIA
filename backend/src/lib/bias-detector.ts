/**
 * Bias Detection Service
 * Detects emotional language, superlatives, and loaded words in content
 */

const LOADED_WORDS: Record<string, number> = {
  // Emotional intensifiers
  incroyable: 0.7,
  extraordinaire: 0.6,
  scandaleux: 0.9,
  honteux: 0.9,
  magnifique: 0.6,
  terrible: 0.8,
  horrible: 0.9,
  merveilleux: 0.6,
  fantastique: 0.6,
  catastrophique: 0.8,
  // Political loaded terms
  extremiste: 0.9,
  radical: 0.7,
  fasciste: 0.95,
  communiste: 0.8,
  dictateur: 0.85,
  // Absolute terms
  toujours: 0.5,
  jamais: 0.5,
  tous: 0.4,
  aucun: 0.4,
  absolument: 0.6,
  completement: 0.5,
  totalement: 0.5,
  // English equivalents
  amazing: 0.6,
  incredible: 0.6,
  shocking: 0.8,
  outrageous: 0.9,
  wonderful: 0.6,
  terrible_en: 0.8,
  horrible_en: 0.9,
  always: 0.5,
  never: 0.5,
  absolutely: 0.6,
  completely: 0.5,
  totally: 0.5,
};

const SUPERLATIVES = [
  "meilleur",
  "pire",
  "plus grand",
  "plus petit",
  "le plus",
  "la plus",
  "les plus",
  "best",
  "worst",
  "greatest",
  "biggest",
  "smallest",
  "most",
  "least",
];

const GENERALIZATIONS = [
  "tout le monde sait",
  "il est evident que",
  "personne ne peut nier",
  "c'est un fait que",
  "everyone knows",
  "it is obvious that",
  "nobody can deny",
  "it is a fact that",
  "studies show",
  "experts say",
  "les etudes montrent",
  "les experts disent",
];

export interface BiasAnalysisResult {
  score: number;
  loadedWords: string[];
  superlatives: string[];
  generalizations: string[];
  emotionalSentences: string[];
  recommendation: "OK" | "REVIEW" | "FLAG";
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findMatches(text: string, patterns: string[]): string[] {
  const normalized = normalizeText(text);
  return patterns.filter((pattern) =>
    normalized.includes(normalizeText(pattern))
  );
}

function findLoadedWords(text: string): { words: string[]; score: number } {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);
  const found: string[] = [];
  let totalScore = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, "");
    if (LOADED_WORDS[cleanWord]) {
      found.push(cleanWord);
      totalScore += LOADED_WORDS[cleanWord];
    }
  }

  return { words: found, score: totalScore };
}

function findEmotionalSentences(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const emotional: string[] = [];

  for (const sentence of sentences) {
    const exclamations = (sentence.match(/!/g) || []).length;
    const caps = (sentence.match(/[A-Z]{3,}/g) || []).length;
    const { score } = findLoadedWords(sentence);

    if (exclamations >= 2 || caps >= 2 || score >= 1.5) {
      emotional.push(sentence.trim());
    }
  }

  return emotional.slice(0, 5);
}

export function analyzeBias(content: string): BiasAnalysisResult {
  const { words: loadedWords, score: loadedScore } = findLoadedWords(content);
  const superlatives = findMatches(content, SUPERLATIVES);
  const generalizations = findMatches(content, GENERALIZATIONS);
  const emotionalSentences = findEmotionalSentences(content);

  const wordCount = content.split(/\s+/).length;
  const loadedDensity = loadedWords.length / Math.max(wordCount, 1);

  const rawScore =
    loadedDensity * 100 +
    superlatives.length * 5 +
    generalizations.length * 10 +
    emotionalSentences.length * 8;

  const score = Math.min(100, Math.round(rawScore));

  let recommendation: "OK" | "REVIEW" | "FLAG" = "OK";
  if (score >= 50) {
    recommendation = "FLAG";
  } else if (score >= 20) {
    recommendation = "REVIEW";
  }

  return {
    score,
    loadedWords: [...new Set(loadedWords)],
    superlatives,
    generalizations,
    emotionalSentences,
    recommendation,
  };
}

export function getBiasLevel(score: number): "low" | "medium" | "high" {
  if (score < 20) return "low";
  if (score < 50) return "medium";
  return "high";
}
