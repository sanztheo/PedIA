# CLAUDE.md - PedIA Project

## Project Overview

PedIA est une encyclopedie auto-evolutive alimentee par l'IA. Chaque recherche enrichit la base de connaissances en creant ou completant des pages interconnectees.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind + SWR |
| Backend | Hono (TypeScript) + Vercel AI SDK v6 |
| Database | PostgreSQL (Prisma) + Qdrant + Redis |
| AI | Gemini / OpenAI / Claude via Vercel AI SDK |
| Queue | BullMQ (Redis) |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## Documentation Index

### Architecture

| File | Description |
|------|-------------|
| `docs/architecture/overview.md` | Vue d'ensemble, flow principal |
| `docs/architecture/frontend.md` | Next.js, composants, patterns |
| `docs/architecture/backend.md` | Hono API, services, queues |
| `docs/architecture/database.md` | PostgreSQL, Qdrant, Redis schemas |

### Features

| File | Description |
|------|-------------|
| `docs/features/streaming-ui.md` | SSE streaming, progress UI |
| `docs/features/graph-visualization.md` | Graph Obsidian-style |
| `docs/features/ai-markdown-editing.md` | Edition par zones avec AI |
| `docs/features/entity-extraction.md` | NER, knowledge graph |

### Research

| File | Description |
|------|-------------|
| `docs/research/web-search-apis.md` | Comparatif Tavily, Bright Data |
| `docs/research/source-verification.md` | Neutralite, detection biais |

### Implementation

| File | Description |
|------|-------------|
| `docs/implementation/tech-stack.md` | Decisions techniques, couts |
| `docs/project.md` | Vision originale du projet |
| `docs/perplixity.md` | Recommandations initiales |

---

## Project Structure

```
PedIA/
+-- frontend/           # Next.js 15 app
|   +-- src/
|       +-- app/        # Pages (App Router)
|       +-- components/ # React components
|       +-- hooks/      # Custom hooks
|       +-- services/   # API client
+-- backend/            # Hono API
|   +-- src/
|       +-- routes/     # API endpoints
|       +-- services/   # Business logic
|       +-- ai/         # AI agent, tools, prompts
|       +-- queue/      # BullMQ queues + workers
|       +-- lib/        # Prisma, Redis, utils
|   +-- tests/          # Backend tests
+-- docs/               # Documentation
```

---

## Key Concepts

### Page Generation Flow

1. User search query
2. Check cache/DB for existing page
3. Web search (Tavily) + scraping (Jina)
4. AI generation with streaming (Gemini/OpenAI/Claude)
5. Entity extraction (AI + regex fallback)
6. Graph linking
7. Save + cache
8. Queue async jobs: extract → link → enrich

### Queue Pipeline (BullMQ)

```
Page created → ExtractWorker (AI entity extraction)
                    ↓
              LinkWorker (dedup + relations)
                    ↓
              EnrichWorker (generate missing pages)
                    ↓
              (loop) → ExtractWorker...
```

| Worker | Purpose |
|--------|---------|
| `extractWorker` | Extract entities from page content using AI (fallback: regex) |
| `linkWorker` | Deduplicate entities, create relations between co-occurring entities |
| `enrichWorker` | Generate pages for important entities (PERSON, ORG, LOCATION, EVENT) |

### Entity Types

PERSON, ORGANIZATION, LOCATION, CONCEPT, EVENT, PRODUCT, WORK, OTHER

### Streaming Events (SSE)

- `step_start` / `step_complete` : Progress tracking
- `content_chunk` : Streamed markdown
- `entity_found` : Detected entities
- `complete` : Redirect to page

---

## Key Files

| Purpose | Location |
|---------|----------|
| API routes | `backend/src/routes/` |
| Services | `backend/src/services/` (PageService, EntityService, GraphService) |
| AI agent | `backend/src/ai/agent.ts` |
| AI prompts | `backend/src/ai/prompts.ts` |
| AI tools | `backend/src/ai/tools/` |
| Queue setup | `backend/src/queue/queues.ts` |
| Queue workers | `backend/src/queue/workers/` |
| Queue orchestration | `backend/src/queue/index.ts` |
| Prisma client | `backend/src/lib/prisma.ts` |
| Redis client | `backend/src/lib/redis.ts` |
| DB schema | `backend/prisma/schema.prisma` |
| Tests | `backend/tests/` |

---

## Development Guidelines

### Code Style

- TypeScript strict mode
- Prefer clear names over comments
- Match existing patterns
- No over-engineering

### Commits

- One line, max 50 chars
- Format: `fix:` | `feat:` | `update:` | `refactor:`
- No AI signatures

### Priority

Correctness > Completeness > Speed

---

## Commands

```bash
# Frontend
cd frontend && npm run dev
npm run lint
npm run build

# Backend
cd backend && npm run dev
npm run typecheck
npm run lint

# Run tests (with env vars)
node --env-file=.env --import=tsx tests/queue.test.ts
```

---

## External Services

| Service | Purpose | Docs |
|---------|---------|------|
| Tavily | Web search | tavily.com |
| Jina AI | Content extraction | jina.ai |
| Qdrant | Vector search | qdrant.tech |
| Gemini / OpenAI / Claude | AI generation | ai.google.dev / openai.com / anthropic.com |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# AI Providers
GOOGLE_GENERATIVE_AI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...

# Search
TAVILY_API_KEY=...
```
