import { tool } from "ai";
import { z } from "zod";
import type { EntityType } from "@prisma/client";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  relevance: number;
}

const ENTITY_TYPES: EntityType[] = [
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "EVENT",
  "CONCEPT",
  "WORK",
  "OTHER",
];

// Max content length to prevent DoS via regex
const MAX_CONTENT_LENGTH = 50000;

// Max iterations per regex pattern to prevent runaway loops
const MAX_REGEX_ITERATIONS = 500;

export function createEntityTool() {
  return tool({
    description:
      "Extrait les entités nommées (personnes, organisations, lieux, etc.) d'un texte pour construire le graphe de connaissances.",
    parameters: z.object({
      content: z.string().describe("Le texte à analyser"),
      maxEntities: z
        .number()
        .min(1)
        .max(30)
        .default(15)
        .describe("Nombre maximum d'entités à extraire"),
    }),
    execute: async ({ content, maxEntities }) => {
      const entities = extractEntitiesFromText(content, maxEntities);
      return {
        success: true,
        count: entities.length,
        entities: entities.map((e) => ({
          name: e.name,
          type: e.type,
          relevance: Math.round(e.relevance * 100),
        })),
      };
    },
  });
}

function extractEntitiesFromText(
  content: string,
  maxEntities: number,
): ExtractedEntity[] {
  // Limit content size to prevent DoS
  const safeContent = content.substring(0, MAX_CONTENT_LENGTH);

  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // Extract wiki-style links first (highest priority)
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  let iterations = 0;
  while (
    (match = wikiLinkRegex.exec(safeContent)) !== null &&
    iterations < MAX_REGEX_ITERATIONS
  ) {
    iterations++;
    const name = match[1].trim();
    const normalized = name.toLowerCase();
    if (!seen.has(normalized) && name.length > 1 && name.length < 100) {
      seen.add(normalized);
      entities.push({
        name,
        type: guessEntityType(name),
        relevance: 0.8,
      });
    }
  }

  // Extract named entities with patterns (limited iterations)
  const patterns: { regex: RegExp; type: EntityType; priority: number }[] = [
    {
      // Formal titles (M., Mme, Dr, Prof) followed by capitalized names
      regex: /(?:M\.|Mme|Dr|Prof)\s+[A-Z][a-zéèêë]+(?:\s+[A-Z][a-zéèêë]+)+/g,
      type: "PERSON",
      priority: 2,
    },
    {
      // Capitalized multi-word phrases (potential entities)
      regex: /[A-Z][a-zéèêë]+(?:\s+[A-Z][a-zéèêë]+){1,3}/g,
      type: "OTHER",
      priority: 1,
    },
  ];

  for (const { regex, type, priority } of patterns) {
    let patternMatch;
    let patternIterations = 0;

    while (
      (patternMatch = regex.exec(safeContent)) !== null &&
      patternIterations < MAX_REGEX_ITERATIONS
    ) {
      patternIterations++;
      const name = patternMatch[0].trim();
      const normalized = name.toLowerCase();

      // Skip if already seen, too short, too long, or common word
      if (
        seen.has(normalized) ||
        name.length <= 2 ||
        name.length > 80 ||
        isCommonWord(name)
      ) {
        continue;
      }

      seen.add(normalized);

      // Determine the actual type based on content analysis
      const inferredType = type === "OTHER" ? guessEntityType(name) : type;

      entities.push({
        name,
        type: inferredType,
        relevance: 0.4 + priority * 0.1,
      });
    }
  }

  return entities
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxEntities);
}

/**
 * Infers entity type based on patterns in the name.
 * Uses prioritized matching with early exit for efficiency.
 */
function guessEntityType(name: string): EntityType {
  const lower = name.toLowerCase();

  // Person patterns (highest specificity)
  if (/^(m\.|mme|dr|prof|sir|lord|lady)\s/i.test(name)) {
    return "PERSON";
  }

  // Organization patterns (check suffixes first - most specific)
  if (/\s(inc|corp|ltd|llc|sa|sarl|gmbh|co|plc|ag)\.?$/i.test(name)) {
    return "ORGANIZATION";
  }

  // Organization keywords
  if (
    /(université|university|institut|institute|académie|academy|ministère|ministry|gouvernement|government|commission|council|committee|association|federation|foundation)/i.test(
      lower,
    )
  ) {
    return "ORGANIZATION";
  }

  // Location patterns
  if (
    /(ville|city|pays|country|région|region|état|state|province|continent|île|island|mer|sea|océan|ocean|mont|mountain|fleuve|river)/i.test(
      lower,
    )
  ) {
    return "LOCATION";
  }

  // Event patterns
  if (
    /(guerre|war|révolution|revolution|traité|treaty|conférence|conference|sommet|summit|bataille|battle|crise|crisis)/i.test(
      lower,
    )
  ) {
    return "EVENT";
  }

  // Concept patterns
  if (
    /(théorie|theory|concept|principe|principle|loi|law|mouvement|movement|philosophie|philosophy|doctrine|ideology)/i.test(
      lower,
    )
  ) {
    return "CONCEPT";
  }

  // Work patterns
  if (
    /(livre|book|film|movie|album|série|series|œuvre|work|roman|novel|pièce|play|symphonie|symphony)/i.test(
      lower,
    )
  ) {
    return "WORK";
  }

  return "OTHER";
}

/**
 * Common French words to filter out from entity extraction
 */
const COMMON_WORDS = new Set([
  // Articles
  "le",
  "la",
  "les",
  "un",
  "une",
  "des",
  "de",
  "du",
  "au",
  "aux",
  // Conjunctions
  "et",
  "ou",
  "mais",
  "donc",
  "or",
  "ni",
  "car",
  // Demonstratives
  "ce",
  "cette",
  "ces",
  // Possessives
  "mon",
  "ma",
  "mes",
  "ton",
  "ta",
  "tes",
  "son",
  "sa",
  "ses",
  "notre",
  "nos",
  "votre",
  "vos",
  "leur",
  "leurs",
  // Interrogatives
  "qui",
  "que",
  "quoi",
  "dont",
  "où",
  "comment",
  "pourquoi",
  "quand",
  // Common verbs
  "être",
  "avoir",
  "faire",
  "dire",
  "aller",
  "voir",
  "savoir",
  "pouvoir",
  // Adverbs
  "plus",
  "moins",
  "très",
  "bien",
  "mal",
  "peu",
  "beaucoup",
  "trop",
  // Prepositions
  "dans",
  "sur",
  "sous",
  "avec",
  "sans",
  "pour",
  "par",
  "entre",
  "avant",
  "après",
  "pendant",
  "depuis",
  "vers",
  "chez",
  // Pronouns
  "il",
  "elle",
  "ils",
  "elles",
  "on",
  "nous",
  "vous",
  "je",
  "tu",
  "cela",
  "ceci",
  "celui",
  "celle",
  "ceux",
  "celles",
  // Quantifiers
  "tout",
  "tous",
  "toute",
  "toutes",
  "autre",
  "autres",
  "même",
  "mêmes",
  // Ordinals
  "premier",
  "première",
  "dernier",
  "dernière",
  // Common adjectives
  "nouveau",
  "nouvelle",
  "grand",
  "grande",
  "petit",
  "petite",
  "bon",
  "bonne",
  "mauvais",
  "mauvaise",
  // Other common words
  "selon",
  "ainsi",
  "alors",
  "aussi",
  "encore",
  "toujours",
  "jamais",
  // Common capitalized words that aren't entities
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
]);

function isCommonWord(word: string): boolean {
  return COMMON_WORDS.has(word.toLowerCase());
}

export function extractEntities(
  content: string,
  maxEntities: number = 15,
): ExtractedEntity[] {
  return extractEntitiesFromText(content, maxEntities);
}
