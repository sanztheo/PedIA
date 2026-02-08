/**
 * Wikidata Integration Service
 * Links entities to their Wikidata QIDs
 */

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

export interface WikidataEntity {
  qid: string;
  label: string;
  description?: string;
  aliases?: string[];
  claims?: Record<string, unknown>;
}

export interface WikidataSearchResult {
  id: string;
  label: string;
  description?: string;
  match: {
    type: string;
    text: string;
  };
}

export async function searchWikidata(
  query: string,
  language = "fr"
): Promise<WikidataSearchResult[]> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: query,
    language,
    uselang: language,
    format: "json",
    limit: "5",
    origin: "*",
  });

  try {
    const response = await fetch(`${WIKIDATA_API}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`);
    }

    const data = (await response.json()) as { search?: WikidataSearchResult[] };
    return data.search || [];
  } catch (error) {
    console.error("Wikidata search failed:", error);
    return [];
  }
}

export async function getWikidataEntity(
  qid: string,
  language = "fr"
): Promise<WikidataEntity | null> {
  const params = new URLSearchParams({
    action: "wbgetentities",
    ids: qid,
    languages: `${language}|en`,
    format: "json",
    origin: "*",
  });

  try {
    const response = await fetch(`${WIKIDATA_API}?${params}`);
    if (!response.ok) {
      throw new Error(`Wikidata API error: ${response.status}`);
    }

    interface WikidataApiResponse {
      entities?: Record<string, {
        labels?: Record<string, { value: string }>;
        descriptions?: Record<string, { value: string }>;
        aliases?: Record<string, { value: string }[]>;
        claims?: Record<string, unknown>;
      }>;
    }

    const data = (await response.json()) as WikidataApiResponse;
    const entity = data.entities?.[qid];

    if (!entity) return null;

    const label =
      entity.labels?.[language]?.value ||
      entity.labels?.en?.value ||
      qid;

    const description =
      entity.descriptions?.[language]?.value ||
      entity.descriptions?.en?.value;

    const aliases = (
      entity.aliases?.[language] ||
      entity.aliases?.en ||
      []
    ).map((a) => a.value);

    return {
      qid,
      label,
      description,
      aliases,
      claims: entity.claims,
    };
  } catch (error) {
    console.error("Wikidata entity fetch failed:", error);
    return null;
  }
}

export async function findBestMatch(
  entityName: string,
  entityType?: string
): Promise<WikidataSearchResult | null> {
  const results = await searchWikidata(entityName);

  if (results.length === 0) return null;

  if (results.length === 1) return results[0];

  const typeFilters: Record<string, string[]> = {
    PERSON: ["human", "person", "homme", "femme"],
    ORGANIZATION: ["organization", "company", "entreprise", "organisation"],
    LOCATION: ["city", "country", "ville", "pays", "lieu"],
    EVENT: ["event", "evenement"],
    PRODUCT: ["product", "produit"],
    WORK: ["film", "book", "livre", "oeuvre", "work"],
  };

  if (entityType && typeFilters[entityType]) {
    const keywords = typeFilters[entityType];
    for (const result of results) {
      const desc = (result.description || "").toLowerCase();
      if (keywords.some((kw) => desc.includes(kw))) {
        return result;
      }
    }
  }

  return results[0];
}

export async function linkEntityToWikidata(
  entityName: string,
  entityType?: string
): Promise<{ qid: string; confidence: number } | null> {
  const match = await findBestMatch(entityName, entityType);

  if (!match) return null;

  const normalizedQuery = entityName.toLowerCase().trim();
  const normalizedLabel = match.label.toLowerCase().trim();

  let confidence = 0.5;

  if (normalizedQuery === normalizedLabel) {
    confidence = 0.95;
  } else if (normalizedLabel.includes(normalizedQuery)) {
    confidence = 0.8;
  } else if (match.match?.type === "label") {
    confidence = 0.9;
  } else if (match.match?.type === "alias") {
    confidence = 0.75;
  }

  return {
    qid: match.id,
    confidence,
  };
}

export async function sparqlQuery(query: string): Promise<unknown[]> {
  try {
    const response = await fetch(SPARQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        Accept: "application/sparql-results+json",
      },
      body: query,
    });

    if (!response.ok) {
      throw new Error(`SPARQL error: ${response.status}`);
    }

    interface SparqlResponse {
      results?: { bindings?: unknown[] };
    }

    const data = (await response.json()) as SparqlResponse;
    return data.results?.bindings || [];
  } catch (error) {
    console.error("SPARQL query failed:", error);
    return [];
  }
}

export function buildEntityInfoQuery(qid: string): string {
  return `
    SELECT ?property ?propertyLabel ?value ?valueLabel WHERE {
      wd:${qid} ?p ?statement .
      ?statement ?ps ?value .
      ?property wikibase:claim ?p .
      ?property wikibase:statementProperty ?ps .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" }
    }
    LIMIT 50
  `;
}
