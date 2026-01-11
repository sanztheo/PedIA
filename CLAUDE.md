# CLAUDE.md - PedIA Project

## Project Overview

PedIA est une encyclopedie auto-evolutive alimentee par l'IA. Chaque recherche enrichit la base de connaissances en creant ou completant des pages interconnectees.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) + Tailwind + SWR |
| Backend | Hono (TypeScript) + Vercel AI SDK |
| Database | PostgreSQL (Prisma) + Qdrant + Redis |
| AI | Gemini / OpenAI / Claude via Vercel AI SDK |
| Queue | BullMQ |
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
|       +-- queue/      # BullMQ workers
|       +-- db/         # Prisma + Qdrant
+-- docs/               # Documentation
+-- CLAUDE.md           # This file
```

---

## Key Concepts

### Page Generation Flow

1. User search query
2. Check cache/DB for existing page
3. Web search (Tavily) + scraping (Jina)
4. AI generation with streaming (Gemini/OpenAI/Claude)
5. Entity extraction
6. Graph linking
7. Save + cache

### Entity Types

PERSON, ORGANIZATION, LOCATION, CONCEPT, EVENT, PRODUCT, WORK

### Streaming Events (SSE)

- `step_start` / `step_complete` : Progress tracking
- `content_chunk` : Streamed markdown
- `entity_found` : Detected entities
- `complete` : Redirect to page

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

# Backend
cd backend && npm run dev

# Lint
npm run lint

# Type check
npm run typecheck
```

---

## External Services

| Service | Purpose | Docs |
|---------|---------|------|
| Tavily | Web search | tavily.com |
| Jina AI | Content extraction | jina.ai |
| Qdrant | Vector search | qdrant.tech |
| Gemini / OpenAI / Claude | AI generation | ai.google.dev / openai.com / anthropic.com |
