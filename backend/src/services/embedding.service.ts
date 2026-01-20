import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import prisma from "../lib/prisma";
import { deleteCache, setCache, getCache } from "../lib/redis";

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";
const SEARCH_CACHE_TTL = 900;

function getOpenAIEmbeddingModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai.embedding(EMBEDDING_MODEL);
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function chunkMarkdown(content: string): string[] {
  const sections = content.split(/(?=^#{1,4}\s)/m);
  const chunks: string[] = [];

  for (const section of sections) {
    if (!section.trim()) continue;

    const sectionTokens = estimateTokens(section);

    if (sectionTokens <= CHUNK_SIZE) {
      chunks.push(section.trim());
      continue;
    }

    const sentences = splitIntoSentences(section);
    let currentChunk = "";
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokens(sentence);

      if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk) {
        chunks.push(currentChunk.trim());

        const overlapSentences = splitIntoSentences(currentChunk);
        let overlapText = "";
        let overlapTokens = 0;
        for (let i = overlapSentences.length - 1; i >= 0; i--) {
          const st = estimateTokens(overlapSentences[i]);
          if (overlapTokens + st > CHUNK_OVERLAP) break;
          overlapText = overlapSentences[i] + " " + overlapText;
          overlapTokens += st;
        }

        currentChunk = overlapText + sentence;
        currentTokens = estimateTokens(currentChunk);
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.filter((c) => c.length > 50);
}

export interface VectorSearchResult {
  pageId: string;
  chunkIndex: number;
  content: string;
  distance: number;
  page?: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
  };
}

export interface HybridSearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  score: number;
  matchType: "vector" | "fulltext" | "hybrid";
}

export const EmbeddingService = {
  async generateEmbedding(text: string): Promise<number[]> {
    const model = getOpenAIEmbeddingModel();
    const { embedding } = await embed({ model, value: text });
    return embedding;
  },

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const model = getOpenAIEmbeddingModel();
    const { embeddings } = await embedMany({ model, values: texts });
    return embeddings;
  },

  async embedPage(pageId: string, content: string): Promise<number> {
    const chunks = chunkMarkdown(content);

    if (chunks.length === 0) {
      console.warn(`[EmbeddingService] No chunks generated for page ${pageId}`);
      return 0;
    }

    const embeddings = await this.generateEmbeddings(chunks);

    await prisma.embedding.deleteMany({ where: { pageId } });

    for (let i = 0; i < chunks.length; i++) {
      const embeddingVector = `[${embeddings[i].join(",")}]`;

      await prisma.$executeRaw`
        INSERT INTO "Embedding" (id, "pageId", "chunkIndex", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${pageId},
          ${i},
          ${chunks[i]},
          ${embeddingVector}::vector,
          NOW()
        )
      `;
    }

    await deleteCache(`page:${pageId}:embeddings`);

    return chunks.length;
  },

  async vectorSearch(
    query: string,
    limit: number = 10,
  ): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const embeddingVector = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        pageId: string;
        chunkIndex: number;
        content: string;
        distance: number;
        page_id: string;
        page_slug: string;
        page_title: string;
        page_summary: string | null;
      }>
    >`
      SELECT
        e.id,
        e."pageId",
        e."chunkIndex",
        e.content,
        e.embedding <=> ${embeddingVector}::vector AS distance,
        p.id AS page_id,
        p.slug AS page_slug,
        p.title AS page_title,
        p.summary AS page_summary
      FROM "Embedding" e
      JOIN "Page" p ON e."pageId" = p.id
      WHERE p.status = 'PUBLISHED'
        AND e.embedding IS NOT NULL
      ORDER BY e.embedding <=> ${embeddingVector}::vector
      LIMIT ${limit}
    `;

    return results.map((r) => ({
      pageId: r.pageId,
      chunkIndex: r.chunkIndex,
      content: r.content,
      distance: r.distance,
      page: {
        id: r.page_id,
        slug: r.page_slug,
        title: r.page_title,
        summary: r.page_summary,
      },
    }));
  },

  async hybridSearch(
    query: string,
    limit: number = 10,
  ): Promise<HybridSearchResult[]> {
    const cacheKey = `search:hybrid:${query.toLowerCase()}:${limit}`;
    const cached = await getCache<HybridSearchResult[]>(cacheKey);
    if (cached) return cached;

    const queryEmbedding = await this.generateEmbedding(query);
    const embeddingVector = `[${queryEmbedding.join(",")}]`;

    const K = 60;

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        slug: string;
        title: string;
        summary: string | null;
        rrf_score: number;
        vector_rank: number | null;
        fulltext_rank: number | null;
      }>
    >`
      WITH vector_search AS (
        SELECT DISTINCT ON (p.id)
          p.id,
          p.slug,
          p.title,
          p.summary,
          ROW_NUMBER() OVER (ORDER BY MIN(e.embedding <=> ${embeddingVector}::vector)) AS vector_rank
        FROM "Page" p
        JOIN "Embedding" e ON p.id = e."pageId"
        WHERE p.status = 'PUBLISHED'
          AND e.embedding IS NOT NULL
        GROUP BY p.id, p.slug, p.title, p.summary
        ORDER BY p.id, MIN(e.embedding <=> ${embeddingVector}::vector)
        LIMIT 50
      ),
      fulltext_search AS (
        SELECT
          p.id,
          p.slug,
          p.title,
          p.summary,
          ROW_NUMBER() OVER (
            ORDER BY ts_rank(to_tsvector('french', p.content), plainto_tsquery('french', ${query})) DESC
          ) AS fulltext_rank
        FROM "Page" p
        WHERE p.status = 'PUBLISHED'
          AND to_tsvector('french', p.content) @@ plainto_tsquery('french', ${query})
        LIMIT 50
      ),
      combined AS (
        SELECT
          COALESCE(v.id, f.id) AS id,
          COALESCE(v.slug, f.slug) AS slug,
          COALESCE(v.title, f.title) AS title,
          COALESCE(v.summary, f.summary) AS summary,
          v.vector_rank,
          f.fulltext_rank,
          COALESCE(1.0 / (${K} + v.vector_rank), 0) +
          COALESCE(1.0 / (${K} + f.fulltext_rank), 0) AS rrf_score
        FROM vector_search v
        FULL OUTER JOIN fulltext_search f ON v.id = f.id
      )
      SELECT * FROM combined
      ORDER BY rrf_score DESC
      LIMIT ${limit}
    `;

    const searchResults: HybridSearchResult[] = results.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      summary: r.summary,
      score: Number(r.rrf_score),
      matchType:
        r.vector_rank && r.fulltext_rank
          ? "hybrid"
          : r.vector_rank
            ? "vector"
            : "fulltext",
    }));

    await setCache(cacheKey, searchResults, SEARCH_CACHE_TTL);

    return searchResults;
  },

  async getPageEmbeddingStats(pageId: string): Promise<{
    hasEmbeddings: boolean;
    chunkCount: number;
    lastUpdated: Date | null;
  }> {
    const embeddings = await prisma.embedding.findMany({
      where: { pageId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return {
      hasEmbeddings: embeddings.length > 0,
      chunkCount: embeddings.length,
      lastUpdated: embeddings[0]?.createdAt ?? null,
    };
  },

  async deletePageEmbeddings(pageId: string): Promise<void> {
    await prisma.embedding.deleteMany({ where: { pageId } });
    await deleteCache(`page:${pageId}:embeddings`);
  },

  async reindexAllPages(): Promise<{ processed: number; failed: number }> {
    const pages = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, content: true },
    });

    let processed = 0;
    let failed = 0;

    for (const page of pages) {
      try {
        await this.embedPage(page.id, page.content);
        processed++;
      } catch (error) {
        console.error(
          `[EmbeddingService] Failed to embed page ${page.id}:`,
          error,
        );
        failed++;
      }
    }

    return { processed, failed };
  },
};
