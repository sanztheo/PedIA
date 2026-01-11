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
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    const name = match[1].trim();
    const normalized = name.toLowerCase();
    if (!seen.has(normalized) && name.length > 1) {
      seen.add(normalized);
      entities.push({
        name,
        type: guessEntityType(name),
        relevance: 0.8,
      });
    }
  }

  const patterns: { regex: RegExp; type: EntityType }[] = [
    {
      regex: /(?:M\.|Mme|Dr|Prof)\s+[A-Z][a-zéèêë]+(?:\s+[A-Z][a-zéèêë]+)+/g,
      type: "PERSON",
    },
    { regex: /[A-Z][a-zéèêë]+(?:\s+[A-Z][a-zéèêë]+){1,3}/g, type: "OTHER" },
  ];

  for (const { regex, type } of patterns) {
    let patternMatch;
    while ((patternMatch = regex.exec(content)) !== null) {
      const name = patternMatch[0].trim();
      const normalized = name.toLowerCase();
      if (!seen.has(normalized) && name.length > 2 && !isCommonWord(name)) {
        seen.add(normalized);
        entities.push({
          name,
          type,
          relevance: 0.6,
        });
      }
    }
  }

  return entities
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxEntities);
}

function guessEntityType(name: string): EntityType {
  const lower = name.toLowerCase();

  if (/^(m\.|mme|dr|prof)\s/i.test(name)) return "PERSON";
  if (/\s(inc|corp|ltd|sa|sarl|gmbh|co)\.?$/i.test(name)) return "ORGANIZATION";
  if (/(université|institut|académie|ministère|gouvernement)/i.test(lower))
    return "ORGANIZATION";
  if (/(ville|pays|région|état|province|continent)/i.test(lower))
    return "LOCATION";
  if (/(guerre|révolution|traité|conférence|sommet)/i.test(lower))
    return "EVENT";
  if (/(théorie|concept|principe|loi|mouvement)/i.test(lower)) return "CONCEPT";
  if (/(livre|film|album|série|œuvre)/i.test(lower)) return "WORK";

  return "OTHER";
}

function isCommonWord(word: string): boolean {
  const common = new Set([
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
    "et",
    "ou",
    "mais",
    "donc",
    "or",
    "ni",
    "car",
    "ce",
    "cette",
    "ces",
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
    "qui",
    "que",
    "quoi",
    "dont",
    "où",
    "comment",
    "pourquoi",
    "quand",
    "être",
    "avoir",
    "faire",
    "dire",
    "aller",
    "voir",
    "savoir",
    "pouvoir",
    "plus",
    "moins",
    "très",
    "bien",
    "mal",
    "peu",
    "beaucoup",
    "trop",
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
    "tout",
    "tous",
    "toute",
    "toutes",
    "autre",
    "autres",
    "même",
    "mêmes",
    "premier",
    "première",
    "dernier",
    "dernière",
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
    "selon",
    "ainsi",
    "alors",
    "aussi",
    "encore",
    "toujours",
    "jamais",
  ]);
  return common.has(word.toLowerCase());
}

export function extractEntities(
  content: string,
  maxEntities: number = 15,
): ExtractedEntity[] {
  return extractEntitiesFromText(content, maxEntities);
}
