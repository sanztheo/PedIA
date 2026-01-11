# PedIA - Backend Architecture

## Stack

- **Framework**: Hono (TypeScript)
- **AI**: Vercel AI SDK + Claude/GPT
- **Queue**: BullMQ + Redis
- **DB**: PostgreSQL + Qdrant
- **Validation**: Zod

---

## Structure des Fichiers

```
backend/
+-- src/
|   +-- index.ts                     # Entry point
|   +-- app.ts                       # Hono app setup
|   +-- routes/
|   |   +-- pages.ts                 # CRUD pages
|   |   +-- search.ts                # Search endpoint
|   |   +-- generate.ts              # AI generation (SSE)
|   |   +-- graph.ts                 # Graph queries
|   +-- services/
|   |   +-- ai/
|   |   |   +-- agent.ts             # AI agent orchestration
|   |   |   +-- prompts.ts           # System prompts
|   |   |   +-- tools.ts             # AI tools definitions
|   |   +-- search/
|   |   |   +-- webSearch.ts         # Tavily/Bright Data
|   |   |   +-- scraper.ts           # Jina/Firecrawl
|   |   |   +-- verification.ts      # Source verification
|   |   +-- entity/
|   |   |   +-- extraction.ts        # LLM entity extraction
|   |   |   +-- linking.ts           # Entity deduplication
|   |   |   +-- graph.ts             # Graph operations
|   |   +-- page/
|   |       +-- pageService.ts       # Page CRUD
|   |       +-- markdownService.ts   # Markdown processing
|   +-- queue/
|   |   +-- workers/
|   |   |   +-- extractWorker.ts
|   |   |   +-- linkWorker.ts
|   |   |   +-- enrichWorker.ts
|   |   +-- queues.ts                # Queue definitions
|   +-- db/
|   |   +-- prisma/
|   |   |   +-- schema.prisma
|   |   +-- qdrant.ts                # Vector DB client
|   +-- middleware/
|   |   +-- auth.ts
|   |   +-- rateLimit.ts
|   |   +-- cors.ts
|   +-- types/
|   |   +-- page.ts
|   |   +-- entity.ts
|   |   +-- search.ts
|   +-- utils/
|       +-- sse.ts                   # SSE helpers
|       +-- markdown.ts
+-- prisma/
|   +-- schema.prisma
+-- package.json
+-- tsconfig.json
```

---

## Routes API

### Pages

```typescript
// routes/pages.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { pageService } from '../services/page/pageService';

const app = new Hono();

// Get page by slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const page = await pageService.getBySlug(slug);

  if (!page) {
    return c.json({ error: 'Page not found' }, 404);
  }

  return c.json(page);
});

// List all pages
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  const pages = await pageService.list({ limit, offset });
  return c.json(pages);
});

// Search pages
app.get('/search', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json({ error: 'Query required' }, 400);
  }

  const results = await pageService.search(query);
  return c.json(results);
});

export default app;
```

### Generate (SSE Streaming)

```typescript
// routes/generate.ts
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { runGenerationAgent } from '../services/ai/agent';

const app = new Hono();

app.get('/', async (c) => {
  const query = c.req.query('q');

  if (!query) {
    return c.json({ error: 'Query required' }, 400);
  }

  return streamSSE(c, async (stream) => {
    // Check if page already exists
    const existingPage = await pageService.findByQuery(query);

    if (existingPage) {
      await stream.writeSSE({
        event: 'existing',
        data: JSON.stringify({
          pageId: existingPage.id,
          slug: existingPage.slug
        })
      });
      return;
    }

    // Run AI generation
    await runGenerationAgent({
      query,
      onStepStart: async (step, details) => {
        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({ type: 'step_start', step, details })
        });
      },
      onStepComplete: async (step) => {
        await stream.writeSSE({
          event: 'step',
          data: JSON.stringify({ type: 'step_complete', step })
        });
      },
      onContentChunk: async (content) => {
        await stream.writeSSE({
          event: 'content',
          data: JSON.stringify({ type: 'content_chunk', content })
        });
      },
      onEntityFound: async (entity) => {
        await stream.writeSSE({
          event: 'entity',
          data: JSON.stringify({ type: 'entity_found', entity })
        });
      },
      onComplete: async (page) => {
        await stream.writeSSE({
          event: 'complete',
          data: JSON.stringify({
            type: 'complete',
            pageId: page.id,
            slug: page.slug
          })
        });
      },
    });
  });
});

export default app;
```

### Graph

```typescript
// routes/graph.ts
import { Hono } from 'hono';
import { graphService } from '../services/entity/graph';

const app = new Hono();

// Get full graph (paginated)
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '100');
  const graph = await graphService.getGraph({ limit });
  return c.json(graph);
});

// Get local graph around a page
app.get('/local/:pageId', async (c) => {
  const pageId = c.req.param('pageId');
  const depth = parseInt(c.req.query('depth') || '2');

  const graph = await graphService.getLocalGraph(pageId, depth);
  return c.json(graph);
});

// Get entity relationships
app.get('/entity/:entityId', async (c) => {
  const entityId = c.req.param('entityId');
  const relations = await graphService.getEntityRelations(entityId);
  return c.json(relations);
});

export default app;
```

---

## AI Agent Service

### Agent Orchestration

```typescript
// services/ai/agent.ts
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createSearchTools } from './tools';
import { buildSystemPrompt } from './prompts';

interface GenerationCallbacks {
  onStepStart: (step: string, details?: string) => Promise<void>;
  onStepComplete: (step: string) => Promise<void>;
  onContentChunk: (content: string) => Promise<void>;
  onEntityFound: (entity: { name: string; type: string }) => Promise<void>;
  onComplete: (page: Page) => Promise<void>;
}

export async function runGenerationAgent(options: {
  query: string;
} & GenerationCallbacks) {
  const { query, ...callbacks } = options;

  // Step 1: Web Search
  await callbacks.onStepStart('search', 'Recherche sur le web...');
  const searchResults = await webSearchService.search(query);
  await callbacks.onStepComplete('search');

  // Step 2: Analyze Sources
  await callbacks.onStepStart('analyze', 'Analyse des sources...');
  const verifiedSources = await verificationService.verify(searchResults);
  await callbacks.onStepComplete('analyze');

  // Step 3: Generate Content with Streaming
  await callbacks.onStepStart('generate', 'Generation du contenu...');

  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt('generate'),
    messages: [
      {
        role: 'user',
        content: `
          Query: ${query}

          Sources:
          ${verifiedSources.map(s => `- ${s.title}: ${s.content}`).join('\n')}

          Generate a comprehensive encyclopedia page in markdown format.
        `
      }
    ],
    maxTokens: 8192,
    onChunk: async ({ chunk }) => {
      if (chunk.type === 'text-delta') {
        await callbacks.onContentChunk(chunk.textDelta);
      }
    },
  });

  const content = await result.text;
  await callbacks.onStepComplete('generate');

  // Step 4: Extract Entities
  await callbacks.onStepStart('extract', 'Extraction des entites...');
  const entities = await entityService.extract(content);

  for (const entity of entities) {
    await callbacks.onEntityFound(entity);
  }
  await callbacks.onStepComplete('extract');

  // Step 5: Create Links
  await callbacks.onStepStart('link', 'Creation des liens...');
  await graphService.createLinks(entities);
  await callbacks.onStepComplete('link');

  // Step 6: Save Page
  const page = await pageService.create({
    title: extractTitle(content),
    slug: generateSlug(query),
    content,
    entities: entities.map(e => e.id),
    sources: verifiedSources.map(s => s.url),
  });

  // Queue enrichment for related pages
  await enrichQueue.add('enrich-related', {
    pageId: page.id,
    entities: entities.map(e => e.id),
  });

  await callbacks.onComplete(page);

  return page;
}
```

### System Prompts

```typescript
// services/ai/prompts.ts
export function buildSystemPrompt(mode: 'generate' | 'extract' | 'edit') {
  const basePrompt = `
Tu es un redacteur d'encyclopedie neutre et factuel.

Principes:
- Neutralite absolue: pas de biais politique, ideologique ou culturel
- Sources multiples: toujours croiser les informations
- Precision: preferer "selon X" a des affirmations categoriques
- Structure: utiliser des sections claires avec headers markdown
`;

  const modePrompts = {
    generate: `
${basePrompt}

Format de sortie (Markdown):
# [Titre]

[Introduction de 2-3 phrases]

## Contexte
[Section contexte]

## [Section principale 1]
[Contenu]

## [Section principale 2]
[Contenu]

## Voir aussi
- [[Entite liee 1]]
- [[Entite liee 2]]

## Sources
- [Source 1](url)
- [Source 2](url)
`,
    extract: `
${basePrompt}

Extrait les entites du texte fourni.
Retourne un JSON avec:
{
  "entities": [
    {
      "name": "Nom de l'entite",
      "type": "PERSON" | "ORGANIZATION" | "LOCATION" | "CONCEPT" | "EVENT" | "PRODUCT",
      "context": "Phrase ou l'entite apparait"
    }
  ]
}
`,
    edit: `
${basePrompt}

Tu dois modifier une section specifique d'une page existante.
Garde le style et le ton coherent avec le reste de la page.
Ne modifie QUE la section demandee.
`,
  };

  return modePrompts[mode];
}
```

### AI Tools

```typescript
// services/ai/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export function createSearchTools(context: ToolContext) {
  return {
    webSearch: tool({
      description: 'Search the web for information on a topic',
      parameters: z.object({
        query: z.string().describe('Search query'),
        maxResults: z.number().default(5),
      }),
      execute: async ({ query, maxResults }) => {
        const results = await webSearchService.search(query, { maxResults });
        return results.map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        }));
      },
    }),

    fetchPage: tool({
      description: 'Fetch and extract content from a URL',
      parameters: z.object({
        url: z.string().url(),
      }),
      execute: async ({ url }) => {
        const content = await scraperService.scrape(url);
        return {
          title: content.title,
          content: content.text.slice(0, 5000), // Limit for context
        };
      },
    }),

    getExistingPage: tool({
      description: 'Check if a page already exists in PedIA',
      parameters: z.object({
        query: z.string(),
      }),
      execute: async ({ query }) => {
        const page = await pageService.findByQuery(query);
        if (page) {
          return {
            exists: true,
            pageId: page.id,
            slug: page.slug,
            title: page.title,
          };
        }
        return { exists: false };
      },
    }),

    editSection: tool({
      description: 'Edit a specific section of an existing page',
      parameters: z.object({
        pageId: z.string(),
        sectionId: z.string(),
        newContent: z.string(),
      }),
      execute: async ({ pageId, sectionId, newContent }) => {
        const result = await markdownService.editSection(
          pageId,
          sectionId,
          newContent
        );
        return { success: true, updatedAt: result.updatedAt };
      },
    }),
  };
}
```

---

## Entity Extraction Service

```typescript
// services/entity/extraction.ts
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const EntitySchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(['PERSON', 'ORGANIZATION', 'LOCATION', 'CONCEPT', 'EVENT', 'PRODUCT']),
    context: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

export async function extractEntities(content: string) {
  const result = await generateObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: EntitySchema,
    prompt: `
      Extract named entities from the following text.
      Only include entities with high confidence (>0.8).

      Text:
      ${content}
    `,
  });

  // Deduplicate and link to existing entities
  const deduplicated = await deduplicateEntities(result.object.entities);

  return deduplicated;
}

async function deduplicateEntities(entities: Entity[]) {
  const results: Entity[] = [];

  for (const entity of entities) {
    // Check for existing entity with similar name
    const existing = await prisma.entity.findFirst({
      where: {
        name: { contains: entity.name, mode: 'insensitive' },
        type: entity.type,
      },
    });

    if (existing) {
      results.push({ ...entity, id: existing.id, isExisting: true });
    } else {
      // Create new entity
      const created = await prisma.entity.create({
        data: {
          name: entity.name,
          type: entity.type,
          slug: generateSlug(entity.name),
        },
      });
      results.push({ ...entity, id: created.id, isExisting: false });
    }
  }

  return results;
}
```

---

## Queue System

### Queue Definitions

```typescript
// queue/queues.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Extraction queue (priority 10)
export const extractQueue = new Queue('extract', {
  connection: redis,
  defaultJobOptions: {
    priority: 10,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// Linking queue (priority 8)
export const linkQueue = new Queue('link', {
  connection: redis,
  defaultJobOptions: {
    priority: 8,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// Enrichment queue (priority 5)
export const enrichQueue = new Queue('enrich', {
  connection: redis,
  defaultJobOptions: {
    priority: 5,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
```

### Enrich Worker

```typescript
// queue/workers/enrichWorker.ts
import { Worker } from 'bullmq';

const enrichWorker = new Worker('enrich', async (job) => {
  const { pageId, entities } = job.data;

  // For each entity, check if it has a dedicated page
  for (const entityId of entities) {
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      include: { page: true },
    });

    if (!entity.page) {
      // Queue page generation for this entity
      await extractQueue.add('generate-entity-page', {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.type,
        sourcePageId: pageId,
      });
    } else {
      // Check if the existing page mentions the source page
      const needsUpdate = await checkNeedsLinkUpdate(entity.page.id, pageId);

      if (needsUpdate) {
        await linkQueue.add('update-links', {
          targetPageId: entity.page.id,
          sourcePageId: pageId,
        });
      }
    }
  }
}, {
  connection: redis,
  concurrency: 5,
});

enrichWorker.on('completed', (job) => {
  console.log(`Enrichment completed for page ${job.data.pageId}`);
});

enrichWorker.on('failed', (job, err) => {
  console.error(`Enrichment failed for page ${job?.data.pageId}:`, err);
});
```

---

## Database Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Page {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  content     String   @db.Text
  summary     String?
  sources     String[] // URLs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  entities    PageEntity[]

  @@index([slug])
  @@index([title])
}

model Entity {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  type        EntityType
  wikidataId  String?  // Optional Wikidata QID
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

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
  context   String? // Sentence where entity appears

  page      Page   @relation(fields: [pageId], references: [id])
  entity    Entity @relation(fields: [entityId], references: [id])

  @@id([pageId, entityId])
}

model EntityRelation {
  id          String   @id @default(uuid())
  fromId      String
  toId        String
  type        String   // e.g., "FOUNDER_OF", "LOCATED_IN"
  properties  Json?
  createdAt   DateTime @default(now())

  from        Entity   @relation("from", fields: [fromId], references: [id])
  to          Entity   @relation("to", fields: [toId], references: [id])

  @@unique([fromId, toId, type])
  @@index([fromId])
  @@index([toId])
}

enum EntityType {
  PERSON
  ORGANIZATION
  LOCATION
  CONCEPT
  EVENT
  PRODUCT
}
```

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Frontend Architecture](./frontend.md)
- [Database Design](./database.md)
- [Entity Extraction](../features/entity-extraction.md)
