import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import prisma from "../lib/prisma";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

interface SimilarResult {
  pageId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

function chunkText(text: string): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim().length > 50) {
      chunks.push(chunk);
    }
  }
  
  return chunks.length > 0 ? chunks : [text.slice(0, 2000)];
}

export class EmbeddingService {
  private openai;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required for embeddings");
    }
    this.openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: this.openai.embedding(EMBEDDING_MODEL),
      value: text.slice(0, 8000),
    });
    return embedding;
  }

  async indexPage(pageId: string): Promise<void> {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, title: true, content: true, summary: true },
    });

    if (!page) {
      throw new Error(`Page not found: ${pageId}`);
    }

    await prisma.embedding.deleteMany({ where: { pageId } });

    const fullText = `${page.title}\n\n${page.summary || ""}\n\n${page.content}`;
    const chunks = chunkText(fullText);

    for (let i = 0; i < chunks.length; i++) {
      const vector = await this.generateEmbedding(chunks[i]);
      
      await prisma.embedding.create({
        data: {
          pageId: page.id,
          chunkIndex: i,
          content: chunks[i],
        },
      });

      await prisma.$executeRawUnsafe(
        `UPDATE "Embedding" SET embedding = $1::vector WHERE "pageId" = $2 AND "chunkIndex" = $3`,
        `[${vector.join(",")}]`,
        page.id,
        i
      );
    }
  }

  async searchSimilar(query: string, limit = 10): Promise<SimilarResult[]> {
    const queryVector = await this.generateEmbedding(query);
    const vectorString = `[${queryVector.join(",")}]`;

    const results = await prisma.$queryRawUnsafe<
      Array<{ pageId: string; chunkIndex: number; content: string; similarity: number }>
    >(
      `SELECT "pageId", "chunkIndex", content, 
              1 - (embedding <=> $1::vector) as similarity
       FROM "Embedding"
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      vectorString,
      limit
    );

    return results;
  }

  async deletePageEmbeddings(pageId: string): Promise<void> {
    await prisma.embedding.deleteMany({ where: { pageId } });
  }

  async reindexAllPages(): Promise<{ indexed: number; failed: string[] }> {
    const pages = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true },
    });

    let indexed = 0;
    const failed: string[] = [];

    for (const page of pages) {
      try {
        await this.indexPage(page.id);
        indexed++;
      } catch {
        failed.push(page.id);
      }
    }

    return { indexed, failed };
  }
}

export const embeddingService = new EmbeddingService();
