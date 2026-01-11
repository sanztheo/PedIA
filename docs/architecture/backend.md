# PedIA - Backend Architecture

## Stack

| Technologie | Role |
|-------------|------|
| Hono | Framework web |
| TypeScript | Langage |
| Vercel AI SDK | Generation AI |
| Prisma | ORM PostgreSQL |
| BullMQ | Queue system |
| Zod | Validation |

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
|   |   |   +-- agent.ts             # AI orchestration
|   |   |   +-- prompts.ts           # System prompts
|   |   |   +-- tools.ts             # AI tools
|   |   +-- search/
|   |   |   +-- webSearch.ts         # Tavily/Bright Data
|   |   |   +-- scraper.ts           # Jina/Firecrawl
|   |   |   +-- verification.ts      # Source verification
|   |   +-- entity/
|   |   |   +-- extraction.ts        # LLM extraction
|   |   |   +-- linking.ts           # Deduplication
|   |   |   +-- graph.ts             # Graph operations
|   |   +-- page/
|   |       +-- pageService.ts       # Page CRUD
|   |       +-- markdownService.ts   # Markdown processing
|   +-- queue/
|   |   +-- workers/
|   |   |   +-- extractWorker.ts
|   |   |   +-- linkWorker.ts
|   |   |   +-- enrichWorker.ts
|   |   +-- queues.ts
|   +-- db/
|   |   +-- prisma/
|   |   +-- qdrant.ts
|   +-- middleware/
|   +-- types/
|   +-- utils/
+-- prisma/
+-- package.json
```

---

## Routes API

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pages/:slug` | Recuperer une page |
| GET | `/api/pages` | Lister les pages |
| GET | `/api/pages/search` | Rechercher |
| POST | `/api/pages` | Creer (admin) |
| PATCH | `/api/pages/:id` | Modifier (admin) |

### Generate

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/generate?q=...` | SSE streaming generation |

**Flow** :
1. Verifier si page existe deja
2. Si oui, retourner event `existing`
3. Sinon, lancer generation avec events SSE

### Graph

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/graph` | Graph complet (pagine) |
| GET | `/api/graph/local/:pageId` | Graph local (depth param) |
| GET | `/api/graph/entity/:entityId` | Relations d'une entite |

---

## Services

### AIService

Orchestration de la generation:
1. Recherche web (Tavily)
2. Extraction contenu (Jina)
3. Verification sources
4. Generation LLM (Claude)
5. Extraction entites
6. Sauvegarde

**Streaming** : Chaque etape emet des events SSE

### SearchService

Interface avec APIs de recherche:
- Tavily pour recherche
- Jina AI pour extraction
- Cache Redis des resultats

### EntityService

Gestion des entites:
- Extraction depuis contenu
- Deduplication
- Linking Wikidata
- Creation relations

### PageService

CRUD des pages:
- Create/Read/Update/Delete
- Indexation Qdrant
- Cache invalidation

---

## AI Tools

L'agent AI dispose de tools pour:

| Tool | Description |
|------|-------------|
| webSearch | Rechercher sur le web |
| fetchPage | Extraire contenu d'une URL |
| getExistingPage | Verifier si page existe |
| editSection | Modifier une section |

Ces tools permettent a l'AI d'etre autonome dans la generation.

---

## System Prompts

### Principes

Tous les prompts suivent ces regles:
1. **Neutralite** : Pas de biais, pas d'opinion
2. **Factuel** : Sources citees, "selon X" plutot qu'affirmations
3. **Structure** : Markdown avec headers clairs
4. **Liens** : Notation `[[Entity]]` pour liens internes

### Modes

| Mode | Usage | Tokens max |
|------|-------|------------|
| generate | Nouvelle page | 8192 |
| extract | Extraction entites | 2048 |
| edit | Modification section | 4096 |

---

## Queue System

### Architecture

BullMQ avec Redis pour jobs asynchrones.

### Queues

| Queue | Priorite | Jobs |
|-------|----------|------|
| extract | 10 (haute) | Extraction entites apres generation |
| link | 8 | Deduplication, Wikidata linking |
| enrich | 5 | Creation pages manquantes |
| verify | 3 (basse) | Verification liens existants |

### Workers

Chaque queue a un worker dedie:
- Concurrence configurable
- Retry avec backoff exponentiel
- Dead letter queue pour echecs

---

## Middleware

### Authentication (Future)

Pas necessaire pour MVP (lecture publique).
A ajouter pour:
- Edition manuelle
- Admin
- Rate limiting par user

### Rate Limiting

| Endpoint | Limite |
|----------|--------|
| /api/generate | 10/min |
| /api/pages | 100/min |
| /api/graph | 50/min |

Implementation avec Redis (sliding window).

### CORS

Whitelist des origines:
- Frontend production
- Localhost dev

---

## Caching Strategy

### Redis Keys

| Pattern | TTL | Contenu |
|---------|-----|---------|
| `page:{slug}` | 1h | Page complete |
| `search:{hash}` | 15min | Resultats recherche |
| `graph:{pageId}:{depth}` | 30min | Graph local |

### Invalidation

Quand une page est modifiee:
1. Invalider `page:{slug}`
2. Invalider tous les `graph:*` (simplifie)
3. Queue job pour re-indexer Qdrant

---

## Error Handling

### Strategies

| Erreur | Action |
|--------|--------|
| Source inaccessible | Skip, utiliser autres sources |
| LLM timeout | Retry avec backoff |
| Rate limit externe | Queue pour retry |
| Validation echouee | Retourner erreur 400 |

### Logging

Niveaux:
- ERROR : Echecs critiques
- WARN : Problemes recuperables
- INFO : Operations normales
- DEBUG : Details (dev only)

---

## Voir Aussi

- [Architecture Overview](./overview.md)
- [Database Design](./database.md)
- [Entity Extraction](../features/entity-extraction.md)
