import { tool } from "ai";
import { z } from "zod";
import type { EntityType } from "@prisma/client";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  relevance: number;
}

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
      // Fallback simple - extraction des [[wiki links]]
      const entities = extractWikiLinks(content, maxEntities);
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

/**
 * Fallback: extrait uniquement les [[wiki links]] du contenu.
 * L'extraction principale se fait via AI dans agent.ts
 */
function extractWikiLinks(
  content: string,
  maxEntities: number,
): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;

  while (
    (match = wikiLinkRegex.exec(content)) !== null &&
    entities.length < maxEntities
  ) {
    const name = match[1].trim();
    const normalized = name.toLowerCase();

    if (!seen.has(normalized) && name.length > 1 && name.length < 100) {
      seen.add(normalized);
      entities.push({
        name,
        type: "OTHER",
        relevance: 0.7,
      });
    }
  }

  return entities;
}

/**
 * Simple fallback pour extraction sans AI.
 * Utilisé uniquement si l'appel AI échoue.
 */
export function extractEntities(
  content: string,
  maxEntities: number = 15,
): ExtractedEntity[] {
  return extractWikiLinks(content, maxEntities);
}
