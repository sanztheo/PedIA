import { tool } from "ai";
import { z } from "zod";

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  answer?: string;
}

async function searchWithTavily(
  query: string,
  maxResults: number = 5,
): Promise<WebSearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn("TAVILY_API_KEY not set, using mock results");
    return mockSearch(query);
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: true,
      include_raw_content: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    query: string;
    answer?: string;
    results: Array<{
      title: string;
      url: string;
      content?: string;
      raw_content?: string;
      score: number;
    }>;
  };

  return {
    query: data.query,
    answer: data.answer,
    results: data.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content || r.raw_content?.substring(0, 1000) || "",
      score: r.score,
    })),
  };
}

function mockSearch(query: string): WebSearchResponse {
  return {
    query,
    answer: `Résumé généré pour: ${query}`,
    results: [
      {
        title: `${query} - Wikipedia`,
        url: `https://fr.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        content: `Article Wikipedia sur ${query}. Contenu de démonstration.`,
        score: 0.95,
      },
      {
        title: `${query} - Encyclopédie`,
        url: `https://example.com/${encodeURIComponent(query)}`,
        content: `Information encyclopédique sur ${query}.`,
        score: 0.85,
      },
    ],
  };
}

export function createSearchTool() {
  return tool({
    description:
      "Recherche sur le web pour trouver des informations actuelles et vérifiées. Utilise cette fonction pour rassembler des sources avant d'écrire un article.",
    parameters: z.object({
      query: z.string().describe("La requête de recherche"),
      maxResults: z
        .number()
        .min(1)
        .max(10)
        .default(5)
        .describe("Nombre maximum de résultats"),
    }),
    execute: async ({ query, maxResults }) => {
      const result = await searchWithTavily(query, maxResults);
      return {
        success: true,
        query: result.query,
        summary: result.answer,
        sources: result.results.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content.substring(0, 500),
          relevance: Math.round(r.score * 100),
        })),
      };
    },
  });
}

export async function webSearch(
  query: string,
  maxResults: number = 5,
): Promise<WebSearchResponse> {
  return searchWithTavily(query, maxResults);
}
