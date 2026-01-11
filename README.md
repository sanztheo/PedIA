# PedIA

**L'encyclopedie auto-evolutive alimentee par l'IA**

PedIA est un systeme de type Wikipedia, mais completement automatise et auto-evolutif. Chaque recherche enrichit la base de connaissances en creant ou completant des pages interconnectees.

---

## Concept

Quand un utilisateur recherche un sujet :

1. **Page existante** → Affichage + enrichissement automatique des pages liees
2. **Page inexistante** → Creation instantanee + detection des entites associees

Le resultat : une encyclopedie dynamique, constamment enrichie et connectee, ou chaque recherche contribue a completer la base de connaissances.

### Exemple

```
Recherche "Tesla"
    ↓
Creation page Tesla
    ↓
Entites detectees : Elon Musk, SpaceX, Model S, Palo Alto...
    ↓
Liens bidirectionnels crees
    ↓
Plus tard, recherche "Elon Musk"
    ↓
Page Elon Musk mentionne deja Tesla (auto-lie)
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Generation AI** | Pages completes generees par Gemini/OpenAI/Claude |
| **Streaming temps reel** | Voir chaque etape de generation |
| **Graph interactif** | Visualisation Obsidian-style des connexions |
| **Auto-evolution** | Enrichissement automatique des pages liees |
| **Neutralite** | Multi-sources, verification, sans biais |
| **SEO-ready** | SSR pour indexation optimale |

---

## Tech Stack

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 15 (App Router) + Tailwind + SWR |
| **Backend** | Hono (TypeScript) + Vercel AI SDK |
| **AI** | Gemini / OpenAI / Claude (au choix) |
| **Database** | PostgreSQL + Qdrant (vectors) + Redis |
| **Queue** | BullMQ |
| **Search** | Tavily + Jina AI |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        PedIA                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   [User] ──search──→ [Frontend Next.js]                 │
│                            │                             │
│                            ↓                             │
│                      [Backend Hono]                      │
│                       /    │    \                        │
│                      ↓     ↓     ↓                       │
│              [Tavily] [AI LLM] [Qdrant]                  │
│                 │        │        │                      │
│                 └────────┼────────┘                      │
│                          ↓                               │
│                    [PostgreSQL]                          │
│                          │                               │
│                          ↓                               │
│                  [BullMQ Workers]                        │
│                   (enrichissement)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage avec recherche centree |
| `/page/[slug]` | Page encyclopedie (SSR) |
| `/search?q=...` | Vue progression generation |
| `/explore` | Graph interactif complet |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis
- Compte API AI (Google Gemini, OpenAI, ou Anthropic)
- Compte Tavily (Search API)

### Installation

```bash
# Clone
git clone https://github.com/sanztheo/PedIA.git
cd PedIA

# Frontend
cd frontend
npm install
cp .env.example .env.local
npm run dev

# Backend (autre terminal)
cd backend
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

**Frontend** (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend** (`backend/.env`)
```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
# AI (choisir un)
GOOGLE_GENERATIVE_AI_API_KEY=...
# ou OPENAI_API_KEY=...
# ou ANTHROPIC_API_KEY=...
TAVILY_API_KEY=tvly-...
QDRANT_URL=http://localhost:6333
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/overview.md) | Vue d'ensemble systeme |
| [Frontend](docs/architecture/frontend.md) | Next.js, composants |
| [Backend](docs/architecture/backend.md) | Hono API, services |
| [Database](docs/architecture/database.md) | Schemas PostgreSQL, Qdrant |
| [Streaming UI](docs/features/streaming-ui.md) | SSE, progress UI |
| [Graph](docs/features/graph-visualization.md) | Visualisation Obsidian-style |
| [Entity Extraction](docs/features/entity-extraction.md) | NER, knowledge graph |
| [Tech Stack](docs/implementation/tech-stack.md) | Decisions techniques |

---

## Roadmap

### Phase 1 - MVP
- [ ] Setup Next.js + Hono
- [ ] Generation basique avec Claude
- [ ] Stockage PostgreSQL
- [ ] UI de recherche

### Phase 2 - Core
- [ ] Streaming SSE complet
- [ ] Entity extraction
- [ ] Graph visualization 2D
- [ ] Qdrant vector search

### Phase 3 - Evolution
- [ ] Auto-enrichissement
- [ ] Queue workers BullMQ
- [ ] Source verification
- [ ] Neo4j (si scale)

### Phase 4 - Polish
- [ ] Graph 3D (optionnel)
- [ ] Mobile optimization
- [ ] Analytics
- [ ] API publique

---

## Principes

### Neutralite

PedIA vise la neutralite absolue :
- Multi-sources (minimum 3)
- Cross-reference des faits
- Pas de biais politique/ideologique
- Sources citees systematiquement

### Performance

- SSR pour SEO
- Cache Redis agressif
- Streaming pour UX fluide
- Lazy loading des composants lourds

### Evolutivite

- Chaque recherche enrichit le systeme
- Liens bidirectionnels automatiques
- Detection des pages manquantes
- Queue d'enrichissement background

---

## Contributing

1. Fork le projet
2. Creer une branche (`git checkout -b feat/amazing-feature`)
3. Commit (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feat/amazing-feature`)
5. Ouvrir une Pull Request

---

## License

MIT

---

## Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) - Streaming AI
- [Google Gemini](https://ai.google.dev/) - AI Generation
- [OpenAI](https://openai.com/) - AI Generation
- [Anthropic Claude](https://anthropic.com/) - AI Generation
- [Tavily](https://tavily.com/) - Web Search API
- [Qdrant](https://qdrant.tech/) - Vector Database
- [react-force-graph](https://github.com/vasturiano/react-force-graph) - Graph Visualization
