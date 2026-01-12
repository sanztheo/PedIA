import { streamText, generateText, type LanguageModelV1 } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import {
  getSystemPrompt,
  buildGenerationPrompt,
  buildExtractionPrompt,
} from "./prompts";
import { createSearchTool, webSearch } from "./tools/search.tool";
import {
  createEntityTool,
  extractEntities,
  type ExtractedEntity,
} from "./tools/entity.tool";
import type { EntityType } from "@prisma/client";

export type AIProvider = "google" | "anthropic" | "openai";

export interface GenerationContext {
  query: string;
  provider?: AIProvider;
  maxTokens?: number;
}

export interface GenerationResult {
  stream: AsyncIterable<string>;
  getContent: () => Promise<string>;
  getEntities: () => Promise<ExtractedEntity[]>;
}

export interface SSEEmitter {
  stepStart: (step: string, details?: string) => Promise<void>;
  stepComplete: (step: string) => Promise<void>;
  stepError: (step: string, error: string) => Promise<void>;
  contentChunk: (content: string) => Promise<void>;
  entityFound: (entity: { name: string; type: EntityType }) => Promise<void>;
  complete: (page: {
    id: string;
    slug: string;
    title: string;
  }) => Promise<void>;
  error: (message: string) => Promise<void>;
}

function getModel(provider: AIProvider = "google"): LanguageModelV1 {
  switch (provider) {
    case "google": {
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
      }
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });
      return google("gemini-2.0-flash") as unknown as LanguageModelV1;
    }
    case "anthropic": {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error("ANTHROPIC_API_KEY environment variable is not set");
      }
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(
        "claude-sonnet-4-20250514",
      ) as unknown as LanguageModelV1;
    }
    case "openai": {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is not set");
      }
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai("gpt-4o") as unknown as LanguageModelV1;
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Validates and sanitizes the generation context
 */
function validateContext(ctx: GenerationContext): void {
  const { query } = ctx;

  if (!query || typeof query !== "string") {
    throw new Error("Query is required and must be a string");
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new Error("Query cannot be empty");
  }

  if (trimmed.length > 500) {
    throw new Error("Query too long (max 500 characters)");
  }

  if (trimmed.length < 2) {
    throw new Error("Query too short (min 2 characters)");
  }
}

export async function generatePage(
  ctx: GenerationContext,
  emitter: SSEEmitter,
): Promise<{ content: string; entities: ExtractedEntity[] }> {
  // Validate input before any expensive operations
  validateContext(ctx);

  const { query, provider = "google", maxTokens = 4096 } = ctx;
  const model = getModel(provider);

  await emitter.stepStart("search", "Recherche web en cours...");

  let searchResults;
  try {
    searchResults = await webSearch(query, 5);
    await emitter.stepComplete("search");
  } catch {
    await emitter.stepError("search", "Échec de la recherche");
    searchResults = { query, results: [], answer: undefined };
  }

  await emitter.stepStart("analyze", "Analyse des sources...");

  const sources = searchResults.results.map(
    (r) => `[${r.title}](${r.url}): ${r.content.substring(0, 300)}...`,
  );

  await emitter.stepComplete("analyze");

  await emitter.stepStart("generate", "Génération du contenu...");

  const userPrompt = buildGenerationPrompt(query, sources);
  let fullContent = "";

  const result = streamText({
    model,
    system: getSystemPrompt("generate"),
    messages: [{ role: "user", content: userPrompt }],
    maxTokens,
  });

  // Consume stream via async iteration - this fully consumes the textStream
  for await (const chunk of result.textStream) {
    fullContent += chunk;
    await emitter.contentChunk(chunk);
  }

  await emitter.stepComplete("generate");

  await emitter.stepStart("extract", "Extraction des entités...");

  let entities: ExtractedEntity[] = [];

  try {
    // Use AI for entity extraction (more accurate)
    entities = await extractEntitiesWithAI(fullContent, provider);

    for (const entity of entities.slice(0, 10)) {
      await emitter.entityFound({ name: entity.name, type: entity.type });
    }
  } catch (error) {
    console.error("AI entity extraction failed, using fallback:", error);
    // Fallback to simple wiki-link extraction
    entities = extractEntities(fullContent, 15);
  }

  await emitter.stepComplete("extract");

  return { content: fullContent, entities };
}

export async function extractEntitiesWithAI(
  content: string,
  provider: AIProvider = "google",
): Promise<ExtractedEntity[]> {
  const model = getModel(provider);

  const result = await generateText({
    model,
    system: getSystemPrompt("extract"),
    messages: [{ role: "user", content: buildExtractionPrompt(content) }],
    maxTokens: 2048,
  });

  try {
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{
        name: string;
        type: string;
        relevance?: number;
      }>;
      return parsed.map((e) => ({
        name: e.name,
        type: e.type as EntityType,
        relevance: e.relevance || 0.5,
      }));
    }
  } catch (error) {
    console.error("Failed to parse AI entity extraction:", error);
  }

  return extractEntities(content);
}

export function createAgentTools() {
  return {
    webSearch: createSearchTool(),
    extractEntities: createEntityTool(),
  };
}
