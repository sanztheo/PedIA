# PedIA - Architecture Overview

## Vision

PedIA est une encyclopedie auto-evolutive alimentee par l'IA. Chaque recherche enrichit la base de connaissances en creant ou completant des pages interconnectees.

## Principes Cles

1. **Auto-evolution** : Chaque recherche genere ou complete des pages
2. **Interconnexion** : Toutes les entites sont liees entre elles (graph)
3. **Neutralite** : Sources verifiees, multi-references, sans biais
4. **Transparence** : L'utilisateur voit les etapes de generation en temps reel

---

## Architecture Globale

```
+-------------------------------------------------------------------+
|                         PedIA ARCHITECTURE                         |
+-------------------------------------------------------------------+
|                                                                    |
|  FRONTEND (Next.js 15 - App Router)                               |
|  +-- /app                                                          |
|  |   +-- /                      -> Homepage (search only)          |
|  |   +-- /page/[slug]           -> Page encyclopedie (SSR/SEO)     |
|  |   +-- /search                -> Vue progression AI              |
|  |   +-- /explore               -> Graph view (Obsidian-style)     |
|  +-- Components                                                    |
|  |   +-- Sidebar                -> Navigation + mini-graph         |
|  |   +-- SearchProgress         -> Steps AI en temps reel          |
|  |   +-- MarkdownViewer         -> Rendu pages                     |
|  |   +-- GraphView              -> Visualisation liens             |
|  +-- Server Components pour SEO optimal                            |
|                                                                    |
|  BACKEND (Hono + TypeScript)                                       |
|  +-- /api                                                          |
|  |   +-- /pages                 -> CRUD pages                      |
|  |   +-- /search                -> Recherche semantique            |
|  |   +-- /generate              -> Generation AI (SSE streaming)   |
|  |   +-- /graph                 -> Relations entites               |
|  +-- Services                                                       |
|  |   +-- AIService              -> Vercel AI SDK (Claude/GPT)      |
|  |   +-- SearchService          -> Web scraping + verification     |
|  |   +-- GraphService           -> Gestion liens entites           |
|  |   +-- EntityService          -> Extraction + deduplication      |
|  +-- Queue (BullMQ/Redis)                                          |
|      +-- extract                -> Extraction entites (priority 10)|
|      +-- link                   -> Liaison entites (priority 8)    |
|      +-- enrich                 -> Enrichissement (priority 5)     |
|                                                                    |
|  DATABASES                                                         |
|  +-- PostgreSQL                 -> Pages, metadata, users          |
|  +-- Qdrant                     -> Embeddings (recherche semantic) |
|  +-- Neo4j (Phase 2)            -> Graph entites complet           |
|                                                                    |
|  EXTERNAL SERVICES                                                 |
|  +-- Tavily / Bright Data       -> Web search APIs                 |
|  +-- Jina AI / Firecrawl        -> Web scraping                    |
|  +-- Claude / GPT               -> Generation contenu              |
|                                                                    |
|  DEPLOY                                                            |
|  +-- Frontend -> Vercel                                            |
|  +-- Backend  -> Railway / Render                                  |
|  +-- DBs      -> Supabase (Postgres) + Qdrant Cloud + Neo4j Aura   |
|                                                                    |
+-------------------------------------------------------------------+
```

---

## Flow Principal

```
User cherche "Tesla"
       |
       v
+------------------+
| 1. Check Cache   | --> Cache hit ? --> Return cached page
+------------------+
       | Cache miss
       v
+------------------+
| 2. Check DB      | --> Page existe ? --> Return page
+------------------+     (+ queue enrichissement si incomplet)
       | Non
       v
+------------------+
| 3. Web Search    | --> Tavily/Bright Data
|    + Scraping    | --> Jina/Firecrawl
+------------------+
       |
       v
+------------------+
| 4. AI Generate   | --> Stream SSE vers frontend
|    (Claude/GPT)  | --> Affiche steps en temps reel
+------------------+
       |
       v
+------------------+
| 5. Extract       | --> Entites: [Elon Musk, SpaceX, ...]
|    Entities      |
+------------------+
       |
       v
+------------------+
| 6. Update Graph  | --> Creer liens bidirectionnels
|    + Queue jobs  | --> Queue: enrichir pages liees
+------------------+
       |
       v
+------------------+
| 7. Save + Cache  | --> Postgres + Redis
+------------------+
       |
       v
+------------------+
| 8. Return Page   | --> Markdown + metadata + liens
+------------------+
```

---

## Composants Cles

### Frontend

| Composant | Role | Technologie |
|-----------|------|-------------|
| Homepage | Recherche centree | Next.js + Tailwind |
| PageView | Affichage encyclopedie | MDX + Server Components |
| SearchProgress | Steps AI temps reel | SSE + React state |
| GraphView | Visualisation liens | react-force-graph / Sigma.js |
| Sidebar | Navigation + mini-graph | React + D3 minimap |

### Backend

| Service | Role | Technologie |
|---------|------|-------------|
| AIService | Generation contenu | Vercel AI SDK + Claude |
| SearchService | Recherche web | Tavily + Jina AI |
| EntityService | Extraction entites | LLM + Pydantic schemas |
| GraphService | Gestion relations | Neo4j / Postgres relations |
| QueueService | Jobs background | BullMQ + Redis |

### Databases

| DB | Role | Justification |
|----|------|---------------|
| PostgreSQL | Pages, users, metadata | Fiable, JSON support |
| Qdrant | Embeddings | Vector search performant |
| Redis | Cache, queues | Rapide, BullMQ natif |
| Neo4j (Phase 2) | Graph complet | Traversal optimise |

---

## Phases de Developpement

### Phase 1 - MVP
- [x] Structure projet
- [ ] Next.js frontend avec search
- [ ] Hono backend avec generation basique
- [ ] PostgreSQL pour pages
- [ ] Streaming SSE basique

### Phase 2 - Core Features
- [ ] Qdrant pour recherche semantique
- [ ] Entity extraction avec LLM
- [ ] Graph visualization (2D)
- [ ] Sidebar navigation

### Phase 3 - Auto-Evolution
- [ ] Queue system (BullMQ)
- [ ] Auto-enrichissement pages liees
- [ ] Missing link detection
- [ ] Neo4j pour graph complet

### Phase 4 - Polish
- [ ] 3D graph view
- [ ] Source verification
- [ ] Bias detection
- [ ] Performance optimization

---

## Decisions Architecturales

### Pourquoi Next.js ?
- SSR/SSG pour SEO (encyclopedie publique)
- App Router pour layouts partages
- Server Components pour performance
- Vercel deploy natif

### Pourquoi Hono ?
- 4x plus rapide qu'Express
- API similaire (migration facile)
- Edge-ready (Cloudflare Workers)
- TypeScript natif

### Pourquoi separation Frontend/Backend ?
- Backend reutilisable (API publique future)
- Scaling independant
- Migration Rust possible pour backend
- Equipes separees si besoin

### Pourquoi PostgreSQL + Neo4j ?
- Postgres: ACID, JSON, mature
- Neo4j: Graph traversal O(log n)
- Postgres suffisant pour MVP
- Neo4j quand graph > 10k nodes

---

## Voir Aussi

- [Frontend Architecture](./frontend.md)
- [Backend Architecture](./backend.md)
- [Database Design](./database.md)
- [Streaming UI](../features/streaming-ui.md)
- [Graph Visualization](../features/graph-visualization.md)
