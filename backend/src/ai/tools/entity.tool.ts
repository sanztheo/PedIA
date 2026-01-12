import type { EntityType } from "@prisma/client";

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  relevance: number;
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
