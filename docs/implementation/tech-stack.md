# PedIA - Tech Stack Decision

## Resume Executif

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | Next.js 15 (App Router) | SSR/SEO, React Server Components |
| Backend | Hono (TypeScript) | Rapide, leger, Edge-ready |
| AI | Vercel AI SDK + Claude | Streaming natif, tools/agents |
| DB Pages | PostgreSQL | ACID, JSON, full-text |
| Vector DB | Qdrant | Vector search performant |
| Graph (Phase 2) | Neo4j | Traversal optimise |
| Cache | Redis | Latence faible, queues |
| Queue | BullMQ | Redis-based, priorites |
| Deploy | Vercel + Railway | Separation frontend/backend |

---

## Frontend

### Next.js 15 (App Router)

**Pourquoi ?**
- SSR pour SEO (encyclopedie publique = pages indexables)
- React Server Components pour performance
- App Router pour layouts partages
- Integration native Vercel

**Alternatives considerees :**
| Option | Raison du rejet |
|--------|-----------------|
| SvelteKit | Ecosysteme AI moins mature |
| Nuxt | Moins d'experience equipe |
| Remix | SSR moins performant |
| SPA pure | SEO impossible |

### UI Libraries

| Lib | Usage |
|-----|-------|
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| react-force-graph | Graph 2D/3D |
| Tiptap | Editor markdown |
| SWR | Data fetching |

---

## Backend

### Hono (TypeScript)

**Pourquoi ?**
- 4x plus rapide qu'Express
- API similaire (migration facile)
- Support natif Edge (Cloudflare Workers)
- TypeScript first-class

**Alternatives considerees :**
| Option | Raison du rejet |
|--------|-----------------|
| Express | Performance inferieure |
| Fastify | Plus complexe |
| tRPC | Overkill pour REST simple |
| Rust (Axum) | MVP trop lent a developper |

### Migration Future Rust

Si besoin de performance extreme:
- Hono et Axum ont des APIs similaires
- Migration progressive possible
- Rust pour hot paths uniquement

---

## AI & Generation

### Vercel AI SDK + Claude

**Pourquoi ?**
- Streaming natif (SSE)
- Tools/Agents integres
- Provider-agnostic (switch facile)
- Excellent avec Next.js

**Modeles :**
| Usage | Modele |
|-------|--------|
| Generation pages | Claude Sonnet |
| Extraction entites | Claude Sonnet |
| Edition sections | Claude Haiku (rapide) |
| Embeddings | OpenAI ada-002 |

---

## Databases

### PostgreSQL

**Pourquoi ?**
- ACID transactions
- JSON support natif
- Full-text search (francais)
- Prisma ORM excellent
- Mature, fiable

**Usage :**
- Pages et contenu
- Entites et relations
- Metadonnees utilisateur
- Logs et analytics

### Qdrant (Vector DB)

**Pourquoi ?**
- Performance excellente
- Open source
- API simple
- Filtering avance

**Alternatives considerees :**
| Option | Raison du rejet |
|--------|-----------------|
| Pinecone | Couteux, moins flexible |
| Weaviate | Plus complexe |
| pgvector | Performance inferieure |
| Chroma | Moins mature |

**Usage :**
- Embeddings des pages
- Recherche semantique
- Similarity search

### Neo4j (Phase 2)

**Pourquoi (plus tard) ?**
- Traversal O(log n)
- Cypher query language
- Visualisation native
- Patterns complexes

**Quand migrer ?**
- Graph > 10,000 nodes
- Requetes traversal frequentes
- Analytics de graph

**Pour MVP :**
PostgreSQL avec relations suffit

### Redis

**Usage :**
- Cache pages populaires
- Cache recherches
- BullMQ queues
- Rate limiting

---

## Queue System

### BullMQ

**Pourquoi ?**
- Redis-based (deja utilise)
- Priorites natives
- Retry/backoff
- Dashboard (Bull Board)

**Queues :**
| Queue | Priorite | Job |
|-------|----------|-----|
| extract | 10 | Extraction entites |
| link | 8 | Liaison Wikidata |
| enrich | 5 | Enrichissement pages |
| verify | 3 | Verification liens |

---

## External Services

### Web Search

| Phase | Service | Raison |
|-------|---------|--------|
| MVP | Tavily | AI-native, free tier |
| Prod | Bright Data | Multi-moteurs, scale |

### Web Scraping

| Phase | Service | Raison |
|-------|---------|--------|
| MVP | Jina AI Reader | Rapide, gratuit |
| Fallback | Firecrawl | Sites JS |

---

## Deployment

### Architecture

```
Vercel (Frontend)
    |
    +-- Next.js App
    +-- Edge Functions (optionnel)

Railway (Backend)
    |
    +-- Hono API
    +-- BullMQ Workers

Supabase / Neon (PostgreSQL)

Qdrant Cloud (Vector DB)

Upstash (Redis)

Neo4j Aura (Phase 2)
```

### Pourquoi cette separation ?

1. **Frontend sur Vercel** : Optimise pour Next.js, CDN global
2. **Backend sur Railway** : Containers persistants, long-running
3. **DBs managed** : Moins d'ops, backups automatiques

---

## Couts Estimes

### Phase MVP (< 1,000 users/mois)

| Service | Tier | Cout |
|---------|------|------|
| Vercel | Hobby | $0 |
| Railway | Starter | ~$5 |
| Supabase | Free | $0 |
| Qdrant Cloud | Free | $0 |
| Upstash | Free | $0 |
| Tavily | Free | $0 |
| Claude API | Usage | ~$20 |
| **Total** | | ~$25/mois |

### Phase Production (10,000 users/mois)

| Service | Tier | Cout |
|---------|------|------|
| Vercel | Pro | $20 |
| Railway | Pro | ~$50 |
| Supabase | Pro | $25 |
| Qdrant Cloud | Startup | ~$50 |
| Upstash | Pay-as-you-go | ~$20 |
| Bright Data | | ~$100 |
| Claude API | Usage | ~$200 |
| **Total** | | ~$465/mois |

---

## Decisions Non-Prises

### A Decider Plus Tard

| Decision | Options | Quand |
|----------|---------|-------|
| Auth | Clerk vs Auth.js vs Custom | Avant users |
| Analytics | Plausible vs PostHog | Apres MVP |
| Monitoring | Sentry vs Highlight | Apres MVP |
| CDN images | Cloudflare vs Vercel | Apres MVP |

---

## Risques & Mitigations

| Risque | Mitigation |
|--------|------------|
| Cout API Claude | Cache agressif, generation incrementale |
| Performance Qdrant | Sharding si necessaire |
| Complexite Neo4j | Reporter a Phase 2 |
| Lock-in Vercel | Next.js portable |
| Rate limits APIs | Multi-provider fallback |

---

## Voir Aussi

- [Architecture Overview](../architecture/overview.md)
- [Frontend Architecture](../architecture/frontend.md)
- [Backend Architecture](../architecture/backend.md)
- [Database Design](../architecture/database.md)
