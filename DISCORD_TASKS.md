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

## Theo - Backend AI + Frontend Streaming

**Focus:** Pipeline IA, SSE streaming backend + frontend

### Premiere tache: Pipeline de generation SSE

Implementer le endpoint `/api/generate` qui:
1. Recoit une query
2. Lance une recherche web (Tavily/Serper)
3. Genere le contenu avec Vercel AI SDK (Gemini/OpenAI/Claude)
4. Stream les etapes en SSE vers le frontend
5. Extrait les entites du contenu genere

### Fichiers a creer:
```
backend/src/
├── ai/
│   ├── agent.ts              # Orchestration AI
│   ├── prompts.ts            # System prompts
│   └── tools/
│       ├── search.tool.ts    # Tool recherche web
│       └── entity.tool.ts    # Tool extraction entites
├── services/
│   ├── generation.service.ts
│   ├── websearch.service.ts
│   └── ner.service.ts
└── routes/
    └── generate.ts           # Completer le SSE streaming

frontend/
├── components/
│   ├── generation/
│   │   ├── GenerationProgress.tsx
│   │   └── StepIndicator.tsx
│   └── graph/
│       ├── GraphView.tsx
│       └── GraphSidebar.tsx
└── app/
    └── search/
        └── page.tsx
```

### Fichiers deja crees (prets a utiliser):
```
backend/src/lib/prisma.ts     # Client Prisma
backend/src/lib/redis.ts      # Client Redis
backend/src/types/index.ts    # Types SSE

frontend/lib/api.ts           # Client API
frontend/lib/sse.ts           # Client SSE + mock
frontend/hooks/useSSE.ts      # Hook SSE pret
frontend/types/index.ts       # Types partages
```

### Pour commencer:
```bash
cd backend
npm install ai @ai-sdk/google @ai-sdk/openai
# Puis creer src/ai/agent.ts
```

---

## Nixou - Backend API + Database

**Focus:** API REST, services, base de donnees

### Premiere tache: Services CRUD Pages

Implementer les services de base pour les pages:
1. PageService - CRUD complet
2. EntityService - gestion des entites
3. Routes pages fonctionnelles
4. Integration Prisma

### Fichiers a creer:
```
backend/src/
├── services/
│   ├── page.service.ts       # CRUD pages
│   ├── entity.service.ts     # CRUD entites
│   └── graph.service.ts      # Relations graph
└── routes/
    ├── pages.ts              # Completer les routes
    ├── graph.ts              # Completer les routes
    └── search.ts             # Completer les routes
```

### Fichiers deja crees (prets a utiliser):
```
backend/src/lib/prisma.ts     # UTILISE CA - Client Prisma singleton
backend/src/lib/redis.ts      # Client Redis + helpers cache
backend/src/types/index.ts    # Types partages
```

### Pour commencer:
```bash
cd backend
# prisma.ts est deja cree!
# Commence direct par src/services/page.service.ts
```

---

## Glamgar - Frontend Core + UI

**Focus:** Interface utilisateur, composants de base

### Premiere tache: Homepage + Layout

Implementer la structure de base:
1. Homepage avec recherche centree (style Google)
2. Layout principal avec sidebar
3. Composants de base (SearchBar, Header)
4. Setup Tailwind avec dark mode

### Fichiers a creer:
```
frontend/
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx    # PREMIER FICHIER
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── search/
│   │   └── SearchBar.tsx
│   └── ui/
│       └── Button.tsx
├── app/
│   ├── page.tsx              # Homepage (modifier)
│   ├── layout.tsx            # Root layout (modifier)
│   └── wiki/
│       └── [slug]/
│           └── page.tsx
```

### Fichiers deja crees (prets a utiliser):
```
frontend/lib/api.ts           # Client API - utilise pour fetch
frontend/types/index.ts       # Types Page, Entity, etc.
```

### Pour commencer:
```bash
cd frontend
# Modifier app/page.tsx pour la homepage
# Puis creer components/layout/MainLayout.tsx
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
# Remplir .env avec tes cles
npm install
npm run db:generate
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
| Database | PostgreSQL (pgvector), Redis |
| AI | Gemini / OpenAI / Claude (au choix) |
| Embeddings | text-embedding-3-small (OpenAI) |

---

## Ordre des Priorites

### Sprint 1 - Fondations
1. **Glamgar** - Homepage + Layout + SearchBar
2. **Nixou** - PageService + routes pages
3. **Theo** - Agent AI + generation SSE basique

### Sprint 2 - Core Features
1. **Glamgar** - Page wiki/[slug] + MarkdownRenderer
2. **Nixou** - EntityService + GraphService + routes graph
3. **Theo** - Extraction entites + GenerationProgress UI + GraphView

### Sprint 3 - Polish
1. **Glamgar** - Dark mode + animations + responsive
2. **Nixou** - Cache Redis + optimisations queries
3. **Theo** - BullMQ jobs + enrichissement auto + GraphSidebar

---

## Communication

- Ping dans le channel dev si bloque
- PR reviews entre vous
- Daily standup rapide (5min max)

---

## Liens Utiles

| Doc | Lien |
|-----|------|
| Vercel AI SDK | https://sdk.vercel.ai/docs |
| Hono | https://hono.dev |
| Prisma | https://prisma.io/docs |
| react-force-graph | https://github.com/vasturiano/react-force-graph |
| Tailwind | https://tailwindcss.com/docs |

---

Let's go!
