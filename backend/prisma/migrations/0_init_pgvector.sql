-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to embeddings table (after Prisma migration)
-- ALTER TABLE "Embedding" ADD COLUMN embedding vector(1536);

-- Create HNSW index for fast similarity search
-- CREATE INDEX ON "Embedding" USING hnsw (embedding vector_cosine_ops);
