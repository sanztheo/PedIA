-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to embeddings table (after Prisma migration)
ALTER TABLE "Embedding" ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS embedding_hnsw_idx ON "Embedding" USING hnsw (embedding vector_cosine_ops);

-- Create GIN index for full-text search on Page content (french)
CREATE INDEX IF NOT EXISTS page_content_fulltext_idx ON "Page" USING GIN (to_tsvector('french', content));
