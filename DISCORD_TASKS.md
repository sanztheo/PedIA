# PedIA - Attribution des Taches

Yo l'equipe, voici la repartition des taches pour PedIA.

---

## Structure du Projet

```
pedia/
├── frontend/          # Next.js 15 + Tailwind
├── backend/           # Hono + Prisma + BullMQ
└── docs/              # Documentation technique
```

---

## Dev 1 - Frontend Core + UI

**Focus:** Interface utilisateur principale

### Taches:
- [ ] Page d'accueil avec barre de recherche centree
- [ ] Layout principal avec sidebar navigation
- [ ] Composant de rendu Markdown pour les pages
- [ ] Integration Tailwind + theming (dark   mode)
- [ ] Page de visualisation d'article (`/wiki/[slug]`)

### Fichiers a creer:
```
frontend/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MainLayout.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── wiki/
│       └── MarkdownRenderer.tsx
├── app/
│   ├── page.tsx (homepage)
│   └── wiki/[slug]/page.tsx
└── lib/
    └── api.ts
```

---

## Dev 2 - Frontend Streaming + Graph

**Focus:** Features avancees frontend

### Taches:
- [ ] Composant de progression SSE (etapes de generation)
- [ ] Integration react-force-graph pour le graphe
- [ ] Panel de graphe dans la sidebar
- [ ] Page "Toutes les pages" avec liste/grille
- [ ] Gestion des etats de chargement

### Fichiers a creer:
```
frontend/
├── components/
│   ├── generation/
│   │   ├── GenerationProgress.tsx
│   │   └── StepIndicator.tsx
│   └── graph/
│       ├── GraphView.tsx
│       ├── GraphSidebar.tsx
│       └── GraphControls.tsx
├── app/
│   └── pages/page.tsx
├── hooks/
│   ├── useSSE.ts
│   └── useGraph.ts
└── lib/
    └── sse.ts
```

---

## Dev 3 - Backend API + Database

**Focus:** API REST et base de donnees

### Taches:
- [ ] Setup Prisma + migrations
- [ ] Routes CRUD pages (`/api/pages`)
- [ ] Routes graphe (`/api/graph`)
- [ ] Routes recherche (`/api/search`)
- [ ] Integration Qdrant pour embeddings
- [ ] Services de base (PageService, EntityService)

### Fichiers a creer:
```
backend/
├── src/
│   ├── services/
│   │   ├── page.service.ts
│   │   ├── entity.service.ts
│   │   ├── graph.service.ts
│   │   └── search.service.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── qdrant.ts
│   │   └── redis.ts
│   └── routes/
│       └── (completer les routes existantes)
└── prisma/
    └── (migrations)
```

---

## Dev 4 - Backend AI Pipeline

**Focus:** Generation IA et extraction d'entites

### Taches:
- [ ] Pipeline de generation de page (SSE streaming)
- [ ] Integration Claude via Vercel AI SDK
- [ ] Extraction d'entites (NER)
- [ ] Recherche web (Brave/Serper/Tavily)
- [ ] Jobs BullMQ pour generation async
- [ ] Tools IA pour modification de zones

### Fichiers a creer:
```
backend/
├── src/
│   ├── ai/
│   │   ├── agent.ts
│   │   ├── prompts.ts
│   │   └── tools/
│   │       ├── search.tool.ts
│   │       ├── entity.tool.ts
│   │       └── zone.tool.ts
│   ├── services/
│   │   ├── generation.service.ts
│   │   ├── websearch.service.ts
│   │   └── ner.service.ts
│   └── jobs/
│       ├── queue.ts
│       └── generation.job.ts
```

---

## Setup Initial (pour tous)

```bash
# Clone + install
git clone <repo>
cd pedia

# Backend
cd backend
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev

# Frontend (autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Stack Rappel

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, Tailwind, SWR, react-force-graph |
| Backend | Hono, Prisma, BullMQ, Vercel AI SDK |
| Database | PostgreSQL, Qdrant, Redis |
| AI | Claude (Anthropic) |

---

## Priorites

1. **Semaine 1:** Homepage + API pages de base + schema DB
2. **Semaine 2:** Generation IA + SSE streaming
3. **Semaine 3:** Graphe + extraction entites
4. **Semaine 4:** Polish + optimisations

---

Questions? Ping dans le channel dev
