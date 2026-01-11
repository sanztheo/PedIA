# PedIA - Database Design

## Overview

PedIA utilise une architecture multi-database optimisee pour chaque cas d'usage:

| Database | Role | Justification |
|----------|------|---------------|
| **PostgreSQL** | Pages, entities, relations | ACID, JSON, full-text search |
| **Qdrant** | Embeddings vectoriels | Recherche semantique rapide |
| **Redis** | Cache, queues | Latence faible, BullMQ natif |
| **Neo4j** (Phase 2) | Graph complet | Traversal O(log n) |

---

## PostgreSQL Schema

### Diagramme ER

```
+-------------------+       +-------------------+
|       Page        |       |      Entity       |
+-------------------+       +-------------------+
| id (uuid) PK      |       | id (uuid) PK      |
| slug (unique)     |       | name              |
| title             |       | slug (unique)     |
| content (text)    |       | type (enum)       |
| summary           |       | wikidataId        |
| sources (text[])  |       | createdAt         |
| createdAt         |       | updatedAt         |
| updatedAt         |       +-------------------+
+-------------------+              |
        |                          |
        |     +-------------------+|
        |     |    PageEntity     ||
        +-----|-------------------+|
              | pageId (FK)       ||
              | entityId (FK)  ---+|
              | context           |
              +-------------------+
                                   |
              +-------------------+|
              |  EntityRelation   ||
              +-------------------+|
              | id (uuid) PK      |
              | fromId (FK)    ---+
              | toId (FK)      ---+
              | type              |
              | properties (json) |
              | createdAt         |
              +-------------------+
```

### Schema Prisma Complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// PAGES
// ============================================

model Page {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  content     String   @db.Text
  summary     String?  @db.VarChar(500)
  sources     String[] // Source URLs

  // Metadata
  viewCount   Int      @default(0)
  isComplete  Boolean  @default(false)
  confidence  Float    @default(0) // Source confidence score

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  entities    PageEntity[]
  sections    PageSection[]

  @@index([slug])
  @@index([title])
  @@index([createdAt])
}

model PageSection {
  id          String   @id @default(uuid())
  pageId      String
  sectionId   String   // e.g., "section_2_1"
  heading     String
  depth       Int      // 1-6 for h1-h6
  content     String   @db.Text
  order       Int

  page        Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, sectionId])
  @@index([pageId])
}

// ============================================
// ENTITIES
// ============================================

model Entity {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  type        EntityType
  description String?    @db.Text
  wikidataId  String?    // Wikidata QID (e.g., Q937)
  imageUrl    String?

  // Timestamps
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  pages       PageEntity[]
  relationsFrom EntityRelation[] @relation("from")
  relationsTo   EntityRelation[] @relation("to")

  @@index([name])
  @@index([type])
  @@index([wikidataId])
}

model PageEntity {
  pageId    String
  entityId  String
  context   String?    // Sentence where entity appears
  position  Int?       // Position in document

  page      Page       @relation(fields: [pageId], references: [id], onDelete: Cascade)
  entity    Entity     @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@id([pageId, entityId])
  @@index([entityId])
}

model EntityRelation {
  id          String   @id @default(uuid())
  fromId      String
  toId        String
  type        String   // "FOUNDER_OF", "LOCATED_IN", etc.
  properties  Json?    // Additional metadata
  confidence  Float    @default(1)
  source      String?  // Source of this relation

  // Temporal fields (for history tracking)
  validFrom   DateTime @default(now())
  validTo     DateTime?

  // Timestamps
  createdAt   DateTime @default(now())

  from        Entity   @relation("from", fields: [fromId], references: [id], onDelete: Cascade)
  to          Entity   @relation("to", fields: [toId], references: [id], onDelete: Cascade)

  @@unique([fromId, toId, type, validFrom])
  @@index([fromId])
  @@index([toId])
  @@index([type])
}

// ============================================
// ENUMS
// ============================================

enum EntityType {
  PERSON
  ORGANIZATION
  LOCATION
  CONCEPT
  EVENT
  PRODUCT
  WORK        // Books, movies, etc.
  OTHER
}

// ============================================
// QUEUE & JOBS
// ============================================

model Job {
  id          String    @id @default(uuid())
  type        JobType
  status      JobStatus @default(PENDING)
  payload     Json
  result      Json?
  error       String?
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)

  createdAt   DateTime  @default(now())
  startedAt   DateTime?
  completedAt DateTime?

  @@index([type, status])
  @@index([createdAt])
}

enum JobType {
  EXTRACT_ENTITIES
  LINK_ENTITIES
  ENRICH_PAGE
  GENERATE_PAGE
  UPDATE_GRAPH
}

enum JobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ============================================
// SEARCH & ANALYTICS
// ============================================

model SearchLog {
  id          String   @id @default(uuid())
  query       String
  resultCount Int
  resultPageId String? // If led to a specific page
  createdAt   DateTime @default(now())

  @@index([query])
  @@index([createdAt])
}
```

---

## Qdrant (Vector Database)

### Collection Schema

```typescript
// Vector collection for semantic search
interface QdrantCollection {
  name: 'page_chunks';
  vectors: {
    size: 1536; // OpenAI ada-002 or similar
    distance: 'Cosine';
  };
  payload: {
    pageId: string;
    chunkIndex: number;
    text: string;
    sectionId?: string;
    entityIds?: string[];
  };
}
```

### Indexing Strategy

```typescript
// services/qdrant.ts
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Create collection
await qdrant.createCollection('page_chunks', {
  vectors: {
    size: 1536,
    distance: 'Cosine',
  },
  optimizers_config: {
    indexing_threshold: 20000,
  },
});

// Index a page
async function indexPage(page: Page) {
  const chunks = splitIntoChunks(page.content, 500); // 500 tokens per chunk

  const points = await Promise.all(
    chunks.map(async (chunk, index) => ({
      id: `${page.id}_${index}`,
      vector: await embeddings.embed(chunk.text),
      payload: {
        pageId: page.id,
        chunkIndex: index,
        text: chunk.text,
        sectionId: chunk.sectionId,
        entityIds: chunk.entityIds,
      },
    }))
  );

  await qdrant.upsert('page_chunks', { points });
}

// Semantic search
async function semanticSearch(query: string, limit = 10) {
  const queryVector = await embeddings.embed(query);

  const results = await qdrant.search('page_chunks', {
    vector: queryVector,
    limit,
    with_payload: true,
  });

  return results.map(r => ({
    pageId: r.payload.pageId,
    text: r.payload.text,
    score: r.score,
  }));
}
```

---

## Redis Schema

### Cache Keys

```typescript
// Cache patterns
const CACHE_KEYS = {
  // Page cache (1 hour TTL)
  page: (slug: string) => `page:${slug}`,

  // Search results cache (15 minutes TTL)
  search: (query: string) => `search:${hash(query)}`,

  // Graph cache (30 minutes TTL)
  graph: (pageId: string, depth: number) => `graph:${pageId}:${depth}`,

  // Entity cache (1 hour TTL)
  entity: (entityId: string) => `entity:${entityId}`,

  // Recent pages (no TTL, managed list)
  recentPages: 'recent_pages',
};

// TTL values
const TTL = {
  PAGE: 3600,        // 1 hour
  SEARCH: 900,       // 15 minutes
  GRAPH: 1800,       // 30 minutes
  ENTITY: 3600,      // 1 hour
};
```

### Cache Service

```typescript
// services/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, data);
    } else {
      await redis.set(key, data);
    }
  },

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  // Page-specific methods
  async getPage(slug: string) {
    return this.get(`page:${slug}`);
  },

  async setPage(slug: string, page: Page) {
    await this.set(`page:${slug}`, page, TTL.PAGE);
  },

  async invalidatePage(slug: string) {
    await redis.del(`page:${slug}`);
    // Also invalidate related graph caches
    await this.invalidate(`graph:*`);
  },
};
```

---

## Neo4j Schema (Phase 2)

### Node Labels

```cypher
// Entity nodes
(:Person {
  id: string,
  name: string,
  slug: string,
  wikidataId: string?,
  birthDate: date?,
  deathDate: date?
})

(:Organization {
  id: string,
  name: string,
  slug: string,
  wikidataId: string?,
  foundedDate: date?
})

(:Location {
  id: string,
  name: string,
  slug: string,
  wikidataId: string?,
  coordinates: point?
})

(:Concept {
  id: string,
  name: string,
  slug: string,
  wikidataId: string?
})

(:Page {
  id: string,
  slug: string,
  title: string,
  createdAt: datetime
})
```

### Relationship Types

```cypher
// Entity relationships
(Person)-[:FOUNDED]->(Organization)
(Person)-[:WORKS_AT]->(Organization)
(Person)-[:BORN_IN]->(Location)
(Organization)-[:LOCATED_IN]->(Location)
(Organization)-[:SUBSIDIARY_OF]->(Organization)
(Concept)-[:RELATED_TO]->(Concept)

// Page relationships
(Page)-[:MENTIONS]->(Entity)
(Page)-[:LINKS_TO]->(Page)
(Entity)-[:HAS_PAGE]->(Page)
```

### Example Queries

```cypher
// Get all entities connected to a page
MATCH (p:Page {slug: $slug})-[:MENTIONS]->(e)
RETURN e

// Get local graph (depth 2) around an entity
MATCH path = (e:Entity {id: $entityId})-[*1..2]-(connected)
RETURN path

// Find shortest path between two entities
MATCH path = shortestPath(
  (a:Entity {id: $fromId})-[*]-(b:Entity {id: $toId})
)
RETURN path

// Get entities that should be linked (missing links)
MATCH (p1:Page)-[:MENTIONS]->(e1:Entity)
MATCH (p2:Page)-[:MENTIONS]->(e2:Entity)
WHERE p1 <> p2
  AND e1 <> e2
  AND NOT (e1)-[:RELATED_TO]-(e2)
  AND (p1)-[:MENTIONS]->(e2)
RETURN e1, e2, count(*) as cooccurrence
ORDER BY cooccurrence DESC
LIMIT 100
```

---

## Data Flow

### Page Creation Flow

```
1. User search "Tesla"
       |
       v
2. Check PostgreSQL (Page table)
       |
       +-- Exists? --> Return page
       |
       v
3. Generate with AI
       |
       v
4. Save to PostgreSQL
       |
       +-- Page table (content)
       +-- PageSection table (sections)
       |
       v
5. Extract entities
       |
       v
6. Save entities
       |
       +-- Entity table (if new)
       +-- PageEntity table (links)
       +-- EntityRelation table (relations)
       |
       v
7. Index in Qdrant
       |
       +-- Generate embeddings
       +-- Upsert vectors
       |
       v
8. Cache in Redis
       |
       +-- page:{slug}
       +-- Invalidate graph caches
       |
       v
9. Queue enrichment jobs
       |
       +-- BullMQ queues
```

### Search Flow

```
1. User query
       |
       v
2. Check Redis cache
       |
       +-- Hit? --> Return cached
       |
       v
3. Semantic search (Qdrant)
       |
       +-- Get top 20 chunks
       |
       v
4. Full-text search (PostgreSQL)
       |
       +-- ILIKE on title, content
       |
       v
5. Merge & rank results
       |
       v
6. Cache in Redis
       |
       v
7. Return results
```

---

## Indexes & Performance

### PostgreSQL Indexes

```sql
-- Pages
CREATE INDEX idx_page_slug ON "Page"(slug);
CREATE INDEX idx_page_title ON "Page" USING gin(to_tsvector('french', title));
CREATE INDEX idx_page_content ON "Page" USING gin(to_tsvector('french', content));
CREATE INDEX idx_page_created ON "Page"(created_at DESC);

-- Entities
CREATE INDEX idx_entity_name ON "Entity"(name);
CREATE INDEX idx_entity_type ON "Entity"(type);
CREATE INDEX idx_entity_wikidata ON "Entity"(wikidata_id) WHERE wikidata_id IS NOT NULL;

-- Relations
CREATE INDEX idx_relation_from ON "EntityRelation"(from_id);
CREATE INDEX idx_relation_to ON "EntityRelation"(to_id);
CREATE INDEX idx_relation_type ON "EntityRelation"(type);
```

### Qdrant Indexes

```typescript
// Payload indexes for filtering
await qdrant.createPayloadIndex('page_chunks', {
  field_name: 'pageId',
  field_schema: 'keyword',
});

await qdrant.createPayloadIndex('page_chunks', {
  field_name: 'entityIds',
  field_schema: 'keyword',
});
```

---

## Backup & Recovery

### PostgreSQL

```bash
# Daily backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Point-in-time recovery with WAL
wal_level = replica
archive_mode = on
```

### Qdrant

```bash
# Snapshot collection
curl -X POST "http://localhost:6333/collections/page_chunks/snapshots"

# Restore from snapshot
curl -X PUT "http://localhost:6333/collections/page_chunks/snapshots/recover" \
  -H "Content-Type: application/json" \
  -d '{"location": "file:///snapshots/page_chunks_snapshot"}'
```

### Redis

```bash
# RDB snapshots (configured)
save 900 1      # 15 minutes if 1 key changed
save 300 10     # 5 minutes if 10 keys changed

# AOF for durability
appendonly yes
appendfsync everysec
```

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Backend Architecture](./backend.md)
- [Entity Extraction](../features/entity-extraction.md)
