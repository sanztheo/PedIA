/**
 * Bias Detection Service
 * LLM-based contextual analysis with keyword fallback
 */

import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCache, setCache } from "./redis";

const BIAS_CACHE_TTL = 3600; // 1 hour
const LLM_TIMEOUT_MS = 10000;

// ============================================================================
// TYPES
// ============================================================================

export interface BiasAnalysisResult {
  score: number;
  loadedWords: string[];
  biasTypes: string[];
  problematicSentences: string[];
  justification: string;
  recommendation: "OK" | "REVIEW" | "FLAG";
  analysisMethod: "llm" | "fallback";
}

interface LLMBiasResponse {
  score: number;
  loaded_words: string[];
  bias_types: string[];
  problematic_sentences: string[];
  justification: string;
}

// ============================================================================
// LLM-BASED ANALYSIS
// ============================================================================

const BIAS_ANALYSIS_PROMPT = `Tu es un expert en analyse de neutralité et de biais dans les textes encyclopédiques.

Analyse le texte suivant et évalue sa neutralité. Réponds UNIQUEMENT avec un objet JSON valide (sans markdown).

Critères d'analyse :
1. **Langage émotionnel** : Mots chargés, superlatifs excessifs, adjectifs subjectifs
2. **Généralisations** : "tout le monde sait", "il est évident", affirmations sans nuance
3. **Biais politique** : Langage partisan, termes péjoratifs pour un camp
4. **Biais de confirmation** : Absence de contre-arguments, sources unilatérales
5. **Ton non encyclopédique** : Exclamations, interpellations directes, opinions présentées comme faits

Format de réponse JSON :
{
  "score": <0-100, 0=neutre parfait, 100=très biaisé>,
  "loaded_words": ["mot1", "mot2"],
  "bias_types": ["emotional", "political", "generalization", "confirmation", "tone"],
  "problematic_sentences": ["phrase 1", "phrase 2"],
  "justification": "<explication courte de l'évaluation>"
}

IMPORTANT : 
- Le contexte compte ! "fasciste" dans un article sur le fascisme n'est PAS un biais.
- Un article scientifique peut mentionner des maladies sans être alarmiste.
- Évalue l'INTENTION et le TON, pas juste les mots.

Texte à analyser :
`;

function getGeminiModel() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
  }
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google("gemini-2.0-flash");
}

async function analyzeBiasWithLLM(content: string): Promise<BiasAnalysisResult> {
  // Truncate content if too long (keep first 4000 chars for cost efficiency)
  const truncatedContent = content.length > 4000 
    ? content.substring(0, 4000) + "..." 
    : content;

  const model = getGeminiModel();

  const result = await generateText({
    model,
    prompt: BIAS_ANALYSIS_PROMPT + truncatedContent,
    maxOutputTokens: 1024,
  });

  // Parse JSON response
  const jsonMatch = result.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid LLM response format");
  }

  const parsed: LLMBiasResponse = JSON.parse(jsonMatch[0]);

  // Determine recommendation based on score
  let recommendation: "OK" | "REVIEW" | "FLAG" = "OK";
  if (parsed.score >= 50) {
    recommendation = "FLAG";
  } else if (parsed.score >= 20) {
    recommendation = "REVIEW";
  }

  return {
    score: Math.min(100, Math.max(0, parsed.score)),
    loadedWords: parsed.loaded_words || [],
    biasTypes: parsed.bias_types || [],
    problematicSentences: (parsed.problematic_sentences || []).slice(0, 5),
    justification: parsed.justification || "",
    recommendation,
    analysisMethod: "llm",
  };
}

// ============================================================================
// KEYWORD FALLBACK (original implementation)
// ============================================================================

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
  always: 0.5,
  never: 0.5,
  absolutely: 0.6,
  completely: 0.5,
  totally: 0.5,
};

const SUPERLATIVES = [
  "meilleur", "pire", "plus grand", "plus petit",
  "le plus", "la plus", "les plus",
  "best", "worst", "greatest", "biggest", "smallest", "most", "least",
];

const GENERALIZATIONS = [
  "tout le monde sait", "il est evident que", "personne ne peut nier",
  "c'est un fait que", "everyone knows", "it is obvious that",
  "nobody can deny", "it is a fact that", "studies show", "experts say",
];

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

function analyzeBiasFallback(content: string): BiasAnalysisResult {
  const { words: loadedWords } = findLoadedWords(content);
  const superlatives = findMatches(content, SUPERLATIVES);
  const generalizations = findMatches(content, GENERALIZATIONS);

  const wordCount = content.split(/\s+/).length;
  const loadedDensity = loadedWords.length / Math.max(wordCount, 1);

  const rawScore =
    loadedDensity * 100 +
    superlatives.length * 5 +
    generalizations.length * 10;

  const score = Math.min(100, Math.round(rawScore));

  let recommendation: "OK" | "REVIEW" | "FLAG" = "OK";
  if (score >= 50) {
    recommendation = "FLAG";
  } else if (score >= 20) {
    recommendation = "REVIEW";
  }

  const biasTypes: string[] = [];
  if (loadedWords.length > 0) biasTypes.push("emotional");
  if (generalizations.length > 0) biasTypes.push("generalization");

  return {
    score,
    loadedWords: [...new Set(loadedWords)],
    biasTypes,
    problematicSentences: [],
    justification: "Analyse par mots-clés (fallback)",
    recommendation,
    analysisMethod: "fallback",
  };
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function analyzeBias(content: string): Promise<BiasAnalysisResult> {
  // Check cache first
  const cacheKey = `bias:${Buffer.from(content.substring(0, 500)).toString("base64").substring(0, 50)}`;
  
  try {
    const cached = await getCache<BiasAnalysisResult>(cacheKey);
    if (cached) return cached;
  } catch {
    // Redis might be unavailable, continue without cache
  }

  // Try LLM analysis first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    const result = await analyzeBiasWithLLM(content);
    
    clearTimeout(timeoutId);

    // Cache the result
    try {
      await setCache(cacheKey, result, BIAS_CACHE_TTL);
    } catch {
      // Cache write failure is non-critical
    }

    return result;
  } catch (error) {
    console.warn("[BiasDetector] LLM analysis failed, using fallback:", error);
    return analyzeBiasFallback(content);
  }
}

// Synchronous version for backward compatibility (uses fallback only)
export function analyzeBiasSync(content: string): BiasAnalysisResult {
  return analyzeBiasFallback(content);
}

export function getBiasLevel(score: number): "low" | "medium" | "high" {
  if (score < 20) return "low";
  if (score < 50) return "medium";
  return "high";
}
